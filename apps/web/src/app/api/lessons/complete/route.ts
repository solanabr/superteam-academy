import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkNewAchievements } from "@/lib/gamification/achievements";
import {
  getAllCourseLessonCounts,
  getCourseById,
  getDeployedAchievements,
} from "@/lib/sanity/queries";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";
import {
  isOnChainProgramLive,
  completeLesson as onChainCompleteLesson,
  finalizeCourse as onChainFinalizeCourse,
  issueCredential as onChainIssueCredential,
  awardAchievement,
  getConnection,
  PROGRAM_ID,
} from "@/lib/solana/academy-program";
import { fetchEnrollment, fetchCourse } from "@/lib/solana/academy-reads";
import { isAllLessonsComplete, isLessonComplete } from "@/lib/solana/bitmap";

interface LessonCompleteRequest {
  lessonId: string;
  courseId: string;
}

/**
 * Derive the 0-based lesson index within a course from Sanity content order.
 * Modules and lessons are flattened in order; the index matches the on-chain bitmap position.
 */
async function deriveLessonIndex(
  courseId: string,
  lessonId: string
): Promise<number> {
  const course = await getCourseById(courseId);
  if (!course) throw new Error(`Course not found: ${courseId}`);
  const allLessons = (course.modules ?? []).flatMap(
    (m: { lessons?: { _id: string }[] }) => m.lessons ?? []
  );
  const index = allLessons.findIndex((l) => l._id === lessonId);
  if (index === -1) throw new Error(`Lesson not found in course: ${lessonId}`);
  return index;
}

export async function POST(request: NextRequest) {
  try {
    // Guard: ensure required Supabase environment variables are set
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      console.error("Missing required Supabase environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as LessonCompleteRequest;
    const { lessonId, courseId } = body;

    if (!lessonId || !courseId) {
      return NextResponse.json(
        { error: "Missing lessonId or courseId" },
        { status: 400 }
      );
    }

    if (
      typeof lessonId !== "string" ||
      lessonId.length > 100 ||
      typeof courseId !== "string" ||
      courseId.length > 100
    ) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Create admin client for SECURITY DEFINER functions
    const supabaseAdmin = createAdminClient();

    // 1. Verify user is enrolled in this course
    const { data: enrollment, error: enrollError } = await supabaseAdmin
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .single();

    if (enrollError || !enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    // 2. Check if lesson is already completed (prevent double-awarding + wasteful on-chain tx)
    const { data: existing } = await supabaseAdmin
      .from("user_progress")
      .select("id, completed")
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId)
      .maybeSingle();

    if (existing?.completed) {
      return NextResponse.json({
        success: true,
        alreadyCompleted: true,
        xpEarned: 0,
        newAchievements: [],
        streakData: null,
      });
    }

    // Look up user's wallet — required for on-chain operations
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("wallet_address, username")
      .eq("id", user.id)
      .single();

    if (profileError) {
      logError({
        errorId: ERROR_IDS.LESSON_COMPLETE_FAILED,
        error: new Error(profileError.message),
        context: {
          route: "/api/lessons/complete",
          note: "profile lookup failed",
        },
      });
    }

    let onChainSignature: string | undefined;
    let finalizeSig: string | null = null;
    let finalized = false;
    let credentialMinted = false;
    let newCertificateId: string | undefined;
    let lessonIndex: number | null = null;
    let xpReward = 10;

    const programLive =
      profile?.wallet_address && (await isOnChainProgramLive());

    if (programLive && profile?.wallet_address) {
      const walletPubkey = new PublicKey(profile.wallet_address);
      const connection = getConnection();

      // Fetch on-chain course to get XP amount BEFORE the completeLesson call
      const onChainCourse = await fetchCourse(courseId, connection, PROGRAM_ID);
      if (onChainCourse) {
        xpReward = Number(onChainCourse.xp_per_lesson) || 10;
      }

      // Derive lesson index from Sanity content order
      lessonIndex = await deriveLessonIndex(courseId, lessonId);

      // Read enrollment BEFORE completeLesson for idempotency.
      // If a previous request confirmed the TX on-chain but the DB write failed,
      // we skip the on-chain call and fall through to the DB upsert below.
      let onChainEnrollment = await fetchEnrollment(
        courseId,
        walletPubkey,
        connection,
        PROGRAM_ID
      );

      const lessonAlreadyOnChain =
        onChainEnrollment !== null &&
        isLessonComplete(
          onChainEnrollment.lesson_flags as (bigint | number)[],
          lessonIndex
        );

      if (!lessonAlreadyOnChain) {
        onChainSignature = await onChainCompleteLesson(
          courseId,
          walletPubkey,
          lessonIndex
        );
        // Re-fetch so the finalization check sees the updated bitmap
        onChainEnrollment = await fetchEnrollment(
          courseId,
          walletPubkey,
          connection,
          PROGRAM_ID
        );
      }

      if (onChainEnrollment && onChainCourse) {
        const totalLessons = (onChainCourse.lesson_count as number) ?? 0;

        // Idempotency for finalize: completed_at already set means a previous
        // request finalized — mark it so the credential check runs.
        if (onChainEnrollment.completed_at) {
          finalized = true;
        } else if (
          isAllLessonsComplete(
            onChainEnrollment.lesson_flags as (bigint | number)[],
            totalLessons
          )
        ) {
          try {
            finalizeSig = await onChainFinalizeCourse(courseId, walletPubkey);
            finalized = true;

            // Mirror finalization into Supabase enrollments table.
            // Non-fatal: on-chain is the source of truth.
            const { error: finalizeUpdateError } = await supabaseAdmin
              .from("enrollments")
              .update({ completed_at: new Date().toISOString() })
              .eq("user_id", user.id)
              .eq("course_id", courseId);

            if (finalizeUpdateError) {
              logError({
                errorId: ERROR_IDS.COURSE_FINALIZE_FAILED,
                error: new Error(finalizeUpdateError.message),
                context: {
                  route: "/api/lessons/complete",
                  note: "On-chain finalized but enrollments.completed_at update failed",
                  courseId,
                },
              });
            }
          } catch (err) {
            logError({
              errorId: ERROR_IDS.COURSE_FINALIZE_FAILED,
              error: err instanceof Error ? err : new Error(String(err)),
              context: { note: "auto-finalize failed, can retry" },
            });
          }
        }

        // Auto-mint credential after finalization.
        // credentialAsset is set by issue_credential — if already populated,
        // a previous request minted successfully; skip silently.
        if (finalized && !onChainEnrollment.credential_asset) {
          try {
            const sanityCourse = await getCourseById(courseId);
            const trackCollectionAddress = sanityCourse?.trackCollectionAddress;

            if (trackCollectionAddress) {
              const trackCollectionPubkey = new PublicKey(
                trackCollectionAddress
              );

              // Interim collection validation: verify the account exists on-chain
              // and is owned by the Metaplex Core program. This catches stale or
              // incorrect CMS data before we invoke issue_credential.
              // Full trustless validation requires storing the collection address
              // in the Course PDA (future program upgrade).
              const MPL_CORE_PROGRAM_ID = new PublicKey(
                "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
              );
              const collectionAccountInfo = await connection.getAccountInfo(
                trackCollectionPubkey
              );
              if (!collectionAccountInfo) {
                throw new Error(
                  `Collection account ${trackCollectionAddress} not found on-chain`
                );
              }
              if (!collectionAccountInfo.owner.equals(MPL_CORE_PROGRAM_ID)) {
                throw new Error(
                  `Collection account ${trackCollectionAddress} is not owned by Metaplex Core`
                );
              }

              const courseName = sanityCourse?.title ?? courseId;

              // Truncate credential name to 32 UTF-8 bytes (on-chain limit)
              let credentialName = `Solarium: ${courseName}`;
              const encoder = new TextEncoder();
              while (encoder.encode(credentialName).length > 32) {
                credentialName = credentialName.slice(0, -1);
              }

              const totalXp =
                Number(onChainCourse.xp_per_lesson) *
                (Number(onChainCourse.lesson_count) || 1);

              const metadataJson = {
                name: credentialName,
                symbol: "STACAD",
                description: `Certificate of completion for ${courseName} on Solarium.`,
                image: "",
                attributes: [
                  { trait_type: "Course", value: courseName },
                  {
                    trait_type: "Completion Date",
                    value: new Date().toISOString().split("T")[0],
                  },
                  {
                    trait_type: "Recipient",
                    value: profile.username ?? profile.wallet_address,
                  },
                  { trait_type: "Platform", value: "Solarium" },
                ],
                properties: { category: "certificate", creators: [] },
                external_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/certificates`,
                seller_fee_basis_points: 0,
              };

              // Store metadata in Supabase nft_metadata table
              const { data: metadataRow, error: metaError } =
                await supabaseAdmin
                  .from("nft_metadata")
                  .insert({ data: metadataJson })
                  .select("id")
                  .single();

              if (metaError || !metadataRow) {
                throw new Error(
                  metaError?.message ?? "Failed to store NFT metadata"
                );
              }

              const metadataUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/certificates/metadata?id=${metadataRow.id}`;

              let credSig: string;
              let mintAddress: PublicKey;
              try {
                const result = await onChainIssueCredential(
                  courseId,
                  walletPubkey,
                  credentialName,
                  metadataUri,
                  1,
                  totalXp,
                  trackCollectionPubkey
                );
                credSig = result.signature;
                mintAddress = result.mintAddress;
              } catch (mintErr) {
                // Clean up orphaned metadata row before re-throwing
                await supabaseAdmin
                  .from("nft_metadata")
                  .delete()
                  .eq("id", metadataRow.id);
                throw mintErr;
              }

              // Mirror credential in Supabase certificates table
              const { data: certRow, error: certInsertError } =
                await supabaseAdmin
                  .from("certificates")
                  .insert({
                    user_id: user.id,
                    course_id: courseId,
                    course_title: courseName,
                    mint_address: mintAddress.toBase58(),
                    metadata_uri: metadataUri,
                    minted_at: new Date().toISOString(),
                    tx_signature: credSig,
                    credential_type: "core",
                  })
                  .select("id")
                  .single();

              if (certInsertError) {
                logError({
                  errorId: ERROR_IDS.CREDENTIAL_ISSUE_FAILED,
                  error: new Error(certInsertError.message),
                  context: {
                    route: "/api/lessons/complete",
                    note: "On-chain credential minted but Supabase insert failed",
                    mintAddress: mintAddress.toBase58(),
                    signature: credSig,
                  },
                });
              } else {
                credentialMinted = true;
                newCertificateId = certRow.id as string;
              }
            }
          } catch (credErr) {
            logError({
              errorId: ERROR_IDS.CREDENTIAL_ISSUE_FAILED,
              error:
                credErr instanceof Error ? credErr : new Error(String(credErr)),
              context: {
                route: "/api/lessons/complete",
                note: "auto-credential mint failed, non-fatal",
                courseId,
              },
            });
          }
        }
      }
    }

    // 3. Upsert user_progress to mark lesson complete
    const { error: progressError } = await supabaseAdmin
      .from("user_progress")
      .upsert(
        {
          user_id: user.id,
          course_id: courseId,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString(),
          tx_signature: onChainSignature ?? null,
          lesson_index: lessonIndex,
        },
        { onConflict: "user_id,lesson_id" }
      );

    if (progressError) {
      return NextResponse.json(
        { error: "Failed to save progress" },
        { status: 500 }
      );
    }

    // Award XP via SECURITY DEFINER function (also handles streak in SQL).
    // Non-fatal: on-chain XP is the source of truth; Supabase is the mirror for
    // streaks/leaderboards. A mirror failure never 500s the user.
    const { error: xpError } = await supabaseAdmin.rpc("award_xp", {
      p_user_id: user.id,
      p_amount: xpReward,
      p_reason: `Completed lesson: ${lessonId}`,
    });

    if (xpError) {
      logError({
        errorId: ERROR_IDS.LESSON_COMPLETE_FAILED,
        error: new Error(xpError.message),
        context: {
          route: "/api/lessons/complete",
          note: "award_xp failed; on-chain XP already minted",
          userId: user.id,
          lessonId,
        },
      });
    }

    // 5. Fetch updated user state for achievement checks
    const { data: xpData } = await supabaseAdmin
      .from("user_xp")
      .select("total_xp, current_streak, longest_streak, last_activity_date")
      .eq("user_id", user.id)
      .single();

    const { data: completedLessons } = await supabaseAdmin
      .from("user_progress")
      .select("lesson_id, course_id, completed")
      .eq("user_id", user.id)
      .eq("completed", true);

    const completedLessonCount = completedLessons?.length ?? 0;

    // Count completed courses (all lessons in a course completed)
    const courseLessonCounts = new Map<string, number>();
    for (const lp of completedLessons ?? []) {
      courseLessonCounts.set(
        lp.course_id,
        (courseLessonCounts.get(lp.course_id) ?? 0) + 1
      );
    }

    const { data: existingAchievements } = await supabaseAdmin
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", user.id);

    const alreadyUnlocked = (existingAchievements ?? []).map(
      (a) => a.achievement_id
    );

    // 6. Check for new achievements
    // Fetch real lesson counts from Sanity to accurately detect course completion.
    // Only achievements with a confirmed on-chain PDA (achievementPda set in Sanity)
    // are eligible — ensures the on-chain TX can succeed before Supabase is written.
    const [sanityCourseCounts, deployedAchievements] = await Promise.all([
      getAllCourseLessonCounts(),
      getDeployedAchievements(),
    ]);
    const totalLessonsPerCourse = new Map(
      sanityCourseCounts.map((c) => [c._id, c.totalLessons])
    );

    // A course is complete when the user has finished ALL its Sanity lessons
    let completedCourseCount = 0;
    for (const [cid, completedCount] of courseLessonCounts) {
      const total = totalLessonsPerCourse.get(cid);
      if (total && total > 0 && completedCount >= total) {
        completedCourseCount++;
      }
    }

    const completedLessonIds = (completedLessons ?? []).map((l) => l.lesson_id);

    const { data: userProfile } = await supabaseAdmin
      .from("profiles")
      .select("created_at")
      .eq("id", user.id)
      .single();

    const { count: userNumber } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .lte("created_at", userProfile?.created_at ?? new Date().toISOString());

    const newAchievements = checkNewAchievements(
      deployedAchievements,
      {
        completedLessons: completedLessonCount,
        completedCourses: completedCourseCount,
        currentStreak: xpData?.current_streak ?? 0,
        hasCompletedRustLesson: completedLessonIds.some(
          (id) =>
            id.startsWith("rust-") ||
            id.includes("-rust-") ||
            id.endsWith("-rust")
        ),
        hasCompletedAnchorCourse: completedLessonIds.some(
          (id) =>
            id.startsWith("anchor-") ||
            id.includes("-anchor-") ||
            id.endsWith("-anchor")
        ),
        // TODO: These 3 achievement signals require cross-course tracking infrastructure.
        // full-stack-solana, speed-runner, and perfect-score are roadmap items.
        // They are permanently unearnable until these signals are implemented.
        hasCompletedAllTracks: false,
        courseCompletionTimeHours: null,
        allTestsPassedFirstTry: false,
        userNumber: userNumber ?? 999,
      },
      alreadyUnlocked
    );

    // 7. Unlock new achievements — on-chain first.
    // The on-chain TX must succeed before the Supabase record is written.
    // Without a live program or wallet, achievements are not recorded.
    const achievementErrors: { id: string; error: string }[] = [];
    const successfullyUnlocked: typeof newAchievements = [];

    if (programLive && profile?.wallet_address) {
      for (const achievement of newAchievements) {
        // On-chain first — AchievementReceipt PDA + NFT must be minted first.
        try {
          await awardAchievement(
            achievement.id,
            new PublicKey(profile.wallet_address)
          );
        } catch (onChainErr) {
          achievementErrors.push({
            id: achievement.id,
            error:
              onChainErr instanceof Error
                ? onChainErr.message
                : String(onChainErr),
          });
          logError({
            errorId: ERROR_IDS.LESSON_ACHIEVEMENT_UNLOCK,
            error:
              onChainErr instanceof Error
                ? onChainErr
                : new Error(String(onChainErr)),
            context: { userId: user.id, achievementId: achievement.id },
          });
          continue;
        }

        // On-chain succeeded — mirror to Supabase.
        const { error: unlockError } = await supabaseAdmin.rpc(
          "unlock_achievement",
          {
            p_user_id: user.id,
            p_achievement_id: achievement.id,
          }
        );

        if (unlockError) {
          logError({
            errorId: ERROR_IDS.LESSON_ACHIEVEMENT_UNLOCK,
            error: new Error(unlockError.message),
            context: {
              note: "on-chain succeeded but Supabase mirror failed",
              userId: user.id,
              achievementId: achievement.id,
            },
          });
        }

        successfullyUnlocked.push(achievement);
      }
    }

    return NextResponse.json({
      success: true,
      alreadyCompleted: false,
      xpEarned: xpReward,
      signature: onChainSignature,
      finalized,
      finalizationSignature: finalizeSig,
      credentialMinted,
      certificateId: newCertificateId,
      newAchievements: successfullyUnlocked.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        icon: a.icon,
      })),
      failedAchievements:
        achievementErrors.length > 0
          ? achievementErrors.map((e) => e.id)
          : undefined,
      streakData: xpData
        ? {
            currentStreak: xpData.current_streak,
            longestStreak: xpData.longest_streak,
            lastActivityDate: xpData.last_activity_date,
          }
        : null,
    });
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.LESSON_COMPLETE_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { route: "/api/lessons/complete" },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
