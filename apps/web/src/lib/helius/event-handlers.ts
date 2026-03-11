import "server-only";

import { PublicKey } from "@solana/web3.js";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  resolveUserId,
  resolveCourseId,
  resolveLessonId,
} from "@/lib/helius/resolvers";
import {
  finalizeCourse as onChainFinalizeCourse,
  issueCredential as onChainIssueCredential,
  awardAchievement as onChainAwardAchievement,
  getConnection,
} from "@/lib/solana/academy-program";
import { fetchEnrollment, fetchCourse } from "@/lib/solana/academy-reads";
import { getProgramId } from "@/lib/solana/pda";
import { isAllLessonsComplete } from "@/lib/solana/bitmap";
import { checkNewAchievements } from "@/lib/gamification/achievements";
import {
  getCourseById,
  getDeployedAchievements,
  getAllCourseLessonCounts,
} from "@/lib/sanity/queries";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";
import type {
  EnrolledEvent,
  EnrollmentClosedEvent,
  LessonCompletedEvent,
  CourseFinalizedEvent,
  CredentialIssuedEvent,
  AchievementAwardedEvent,
  XpRewardedEvent,
} from "@/lib/helius/types";

// ---------------------------------------------------------------------------
// Helper: queue a failed on-chain action for later retry
// ---------------------------------------------------------------------------

async function queueFailedAction(
  userId: string,
  actionType: string,
  referenceId: string,
  payload: Record<string, unknown>,
  error: unknown
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  try {
    const supabase = createAdminClient();
    await supabase.from("pending_onchain_actions").upsert(
      {
        user_id: userId,
        action_type: actionType,
        reference_id: referenceId,
        payload: payload as unknown as import("@/lib/supabase/types").Json,
        last_error: message,
        failed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,action_type,reference_id" }
    );
  } catch (queueErr) {
    logError({
      errorId: ERROR_IDS.LESSON_COMPLETE_FAILED,
      error: queueErr instanceof Error ? queueErr : new Error(String(queueErr)),
      context: { userId, actionType, referenceId, originalError: message },
    });
  }
}

// ---------------------------------------------------------------------------
// Solana Dev Path course IDs (for full-stack achievement detection)
// ---------------------------------------------------------------------------

const SOLANA_DEV_PATH_COURSES = [
  "course-solana-fundamentals",
  "course-rust-for-solana",
  "course-anchor-framework",
  "course-solana-frontend",
];

// ---------------------------------------------------------------------------
// handleEnrolled
// ---------------------------------------------------------------------------

export async function handleEnrolled(
  event: EnrolledEvent,
  txSignature: string
): Promise<void> {
  const userId = await resolveUserId(event.learner);
  if (!userId) return;

  const connection = getConnection();
  const courseId = await resolveCourseId(event.course, connection);
  if (!courseId) return;

  const supabase = createAdminClient();
  const { error } = await supabase.from("enrollments").upsert(
    {
      user_id: userId,
      course_id: courseId,
      enrolled_at: new Date(event.timestamp * 1000).toISOString(),
      tx_signature: txSignature,
      wallet_address: event.learner,
    },
    { onConflict: "user_id,course_id" }
  );

  if (error) {
    logError({
      errorId: ERROR_IDS.ENROLLMENT_SYNC_FAILED,
      error: new Error(error.message),
      context: { handler: "handleEnrolled", userId, courseId, txSignature },
    });
  }
}

// ---------------------------------------------------------------------------
// handleEnrollmentClosed
// ---------------------------------------------------------------------------

export async function handleEnrollmentClosed(
  event: EnrollmentClosedEvent,
  _txSignature: string
): Promise<void> {
  const userId = await resolveUserId(event.learner);
  if (!userId) return;

  const connection = getConnection();
  const courseId = await resolveCourseId(event.course, connection);
  if (!courseId) return;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("enrollments")
    .delete()
    .eq("user_id", userId)
    .eq("course_id", courseId);

  if (error) {
    logError({
      errorId: ERROR_IDS.ENROLLMENT_SYNC_FAILED,
      error: new Error(error.message),
      context: {
        handler: "handleEnrollmentClosed",
        userId,
        courseId,
      },
    });
  }
}

// ---------------------------------------------------------------------------
// handleLessonCompleted
// ---------------------------------------------------------------------------

export async function handleLessonCompleted(
  event: LessonCompletedEvent,
  txSignature: string
): Promise<void> {
  const userId = await resolveUserId(event.learner);
  if (!userId) return;

  const connection = getConnection();
  const courseId = await resolveCourseId(event.course, connection);
  if (!courseId) return;

  const lessonId = await resolveLessonId(courseId, event.lessonIndex);

  const supabase = createAdminClient();

  // 1. Upsert user_progress (only if lessonId was resolved)
  if (lessonId) {
    const { error: progressError } = await supabase
      .from("user_progress")
      .upsert(
        {
          user_id: userId,
          course_id: courseId,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date(event.timestamp * 1000).toISOString(),
          tx_signature: txSignature,
          lesson_index: event.lessonIndex,
        },
        { onConflict: "user_id,lesson_id" }
      );

    if (progressError) {
      logError({
        errorId: ERROR_IDS.LESSON_COMPLETE_FAILED,
        error: new Error(progressError.message),
        context: {
          handler: "handleLessonCompleted",
          step: "upsert_progress",
          userId,
          courseId,
          lessonId,
        },
      });
    }
  }

  // 2. Award XP via SECURITY DEFINER function
  const { error: xpError } = await supabase.rpc("award_xp", {
    p_user_id: userId,
    p_amount: event.xpEarned,
    p_reason: `Completed lesson: ${lessonId ?? `index:${event.lessonIndex}`}`,
    p_idempotency_key: `${txSignature}:LessonCompleted`,
    p_tx_signature: txSignature,
  });

  if (xpError) {
    logError({
      errorId: ERROR_IDS.LESSON_COMPLETE_FAILED,
      error: new Error(xpError.message),
      context: {
        handler: "handleLessonCompleted",
        step: "award_xp",
        userId,
        courseId,
      },
    });
  }

  // 3. Check if all lessons complete -> finalize course on-chain
  await tryFinalizeCourse(userId, courseId, event.learner, connection);

  // 4. Check achievement eligibility
  await checkAndAwardAchievements(userId, event.learner, supabase);
}

// ---------------------------------------------------------------------------
// handleCourseFinalized
// ---------------------------------------------------------------------------

export async function handleCourseFinalized(
  event: CourseFinalizedEvent,
  txSignature: string
): Promise<void> {
  const userId = await resolveUserId(event.learner);
  if (!userId) return;

  const connection = getConnection();
  const courseId = await resolveCourseId(event.course, connection);
  if (!courseId) return;

  const supabase = createAdminClient();

  // 1. Update enrollments.completed_at
  const { error: updateError } = await supabase
    .from("enrollments")
    .update({ completed_at: new Date(event.timestamp * 1000).toISOString() })
    .eq("user_id", userId)
    .eq("course_id", courseId);

  if (updateError) {
    logError({
      errorId: ERROR_IDS.COURSE_FINALIZE_FAILED,
      error: new Error(updateError.message),
      context: {
        handler: "handleCourseFinalized",
        step: "update_completed_at",
        userId,
        courseId,
      },
    });
  }

  // 2. Award bonus XP
  if (event.bonusXp > 0) {
    const { error: xpError } = await supabase.rpc("award_xp", {
      p_user_id: userId,
      p_amount: event.bonusXp,
      p_reason: `Course completion bonus: ${courseId}`,
      p_idempotency_key: `${txSignature}:CourseFinalized:bonus`,
      p_tx_signature: txSignature,
    });

    if (xpError) {
      logError({
        errorId: ERROR_IDS.COURSE_FINALIZE_FAILED,
        error: new Error(xpError.message),
        context: {
          handler: "handleCourseFinalized",
          step: "award_bonus_xp",
          userId,
          courseId,
        },
      });
    }
  }

  // 3. Award creator reward XP (minted on-chain to the course creator)
  if (event.creatorXp > 0) {
    const creatorUserId = await resolveUserId(event.creator);
    if (creatorUserId) {
      const { error: creatorXpError } = await supabase.rpc("award_xp", {
        p_user_id: creatorUserId,
        p_amount: event.creatorXp,
        p_reason: `Creator reward: ${courseId}`,
        p_idempotency_key: `${txSignature}:CourseFinalized:creator`,
        p_tx_signature: txSignature,
      });

      if (creatorXpError) {
        logError({
          errorId: ERROR_IDS.COURSE_FINALIZE_FAILED,
          error: new Error(creatorXpError.message),
          context: {
            handler: "handleCourseFinalized",
            step: "award_creator_xp",
            creatorUserId,
            courseId,
          },
        });
      }
    }
  }

  // 4. Issue credential NFT
  await tryIssueCredential(userId, courseId, event.learner, connection);
}

// ---------------------------------------------------------------------------
// handleCredentialIssued
// ---------------------------------------------------------------------------

export async function handleCredentialIssued(
  event: CredentialIssuedEvent,
  _txSignature: string
): Promise<void> {
  const userId = await resolveUserId(event.learner);
  if (!userId) return;

  // Certificate should already exist from handleCourseFinalized.
  // Log for observability only — this is NOT an error.
  console.info(
    `[webhook] CredentialIssued: userId=${userId} asset=${event.credentialAsset} track=${event.trackId} level=${event.currentLevel}`
  );
}

// ---------------------------------------------------------------------------
// handleAchievementAwarded
// ---------------------------------------------------------------------------

export async function handleAchievementAwarded(
  event: AchievementAwardedEvent,
  txSignature: string
): Promise<void> {
  const userId = await resolveUserId(event.recipient);
  if (!userId) return;

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("unlock_achievement", {
    p_user_id: userId,
    p_achievement_id: event.achievementId,
    p_tx_signature: txSignature,
    p_asset_address: event.asset,
  });

  if (error) {
    logError({
      errorId: ERROR_IDS.ACHIEVEMENT_UNLOCK_FAILED,
      error: new Error(error.message),
      context: {
        handler: "handleAchievementAwarded",
        userId,
        achievementId: event.achievementId,
      },
    });
  }

  // The on-chain award_achievement instruction also mints XP tokens.
  // Mirror the XP to Supabase so the activity feed and totals stay in sync.
  if (event.xpReward > 0) {
    const { error: xpError } = await supabase.rpc("award_xp", {
      p_user_id: userId,
      p_amount: event.xpReward,
      p_reason: `Achievement reward: ${event.achievementId}`,
      p_idempotency_key: `${txSignature}:AchievementAwarded:xp`,
      p_tx_signature: txSignature,
    });

    if (xpError) {
      logError({
        errorId: ERROR_IDS.ACHIEVEMENT_UNLOCK_FAILED,
        error: new Error(xpError.message),
        context: {
          handler: "handleAchievementAwarded",
          step: "award_xp",
          userId,
          achievementId: event.achievementId,
          xpReward: event.xpReward,
        },
      });
    }
  }
}

// ---------------------------------------------------------------------------
// handleXpRewarded
// ---------------------------------------------------------------------------

export async function handleXpRewarded(
  event: XpRewardedEvent,
  txSignature: string
): Promise<void> {
  const userId = await resolveUserId(event.recipient);
  if (!userId) return;

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("award_xp", {
    p_user_id: userId,
    p_amount: Number(event.amount),
    p_reason: event.memo || "XP reward",
    p_idempotency_key: `${txSignature}:XpRewarded`,
    p_tx_signature: txSignature,
  });

  if (error) {
    logError({
      errorId: ERROR_IDS.XP_REWARD_FAILED,
      error: new Error(error.message),
      context: {
        handler: "handleXpRewarded",
        userId,
        amount: event.amount,
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Internal: try to finalize a course on-chain if all lessons are complete
// ---------------------------------------------------------------------------

async function tryFinalizeCourse(
  userId: string,
  courseId: string,
  walletAddress: string,
  connection: ReturnType<typeof getConnection>
): Promise<void> {
  const learnerPk = new PublicKey(walletAddress);

  try {
    const enrollment = await fetchEnrollment(
      courseId,
      learnerPk,
      connection,
      getProgramId()
    );
    if (!enrollment) return;

    // Already finalized on-chain
    if (enrollment.completed_at) return;

    const course = await fetchCourse(courseId, connection, getProgramId());
    if (!course) return;

    const lessonCount = Number(course.lesson_count);
    const lessonFlags = enrollment.lesson_flags as (bigint | number)[];

    if (!isAllLessonsComplete(lessonFlags, lessonCount)) return;

    await onChainFinalizeCourse(courseId, learnerPk);
  } catch (err) {
    await queueFailedAction(
      userId,
      "course_finalize",
      courseId,
      {
        courseId,
        walletAddress,
      },
      err
    );
  }
}

// ---------------------------------------------------------------------------
// Internal: try to issue a credential NFT after course finalization
// ---------------------------------------------------------------------------

async function tryIssueCredential(
  userId: string,
  courseId: string,
  walletAddress: string,
  connection: ReturnType<typeof getConnection>
): Promise<void> {
  const learnerPk = new PublicKey(walletAddress);

  try {
    // Check if credential already issued on-chain
    const enrollment = await fetchEnrollment(
      courseId,
      learnerPk,
      connection,
      getProgramId()
    );
    if (!enrollment) return;
    if (enrollment.credential_asset) return;

    // Fetch course data from Sanity for metadata
    const sanityCourse = await getCourseById(courseId);
    if (!sanityCourse) return;

    const trackCollectionAddress = sanityCourse.trackCollectionAddress as
      | string
      | undefined;
    if (!trackCollectionAddress) {
      throw new Error(
        `Course "${courseId}" has no trackCollectionAddress in Sanity — re-sync the course from the admin console`
      );
    }

    const trackCollectionPubkey = new PublicKey(trackCollectionAddress);
    const courseName = sanityCourse.title ?? courseId;

    // Truncate credential name to 32 UTF-8 bytes (on-chain limit)
    let credentialName = `Superteam Academy: ${courseName}`;
    const encoder = new TextEncoder();
    while (encoder.encode(credentialName).length > 32) {
      credentialName = credentialName.slice(0, -1);
    }

    // Fetch on-chain course for XP calculation
    const onChainCourse = await fetchCourse(
      courseId,
      connection,
      getProgramId()
    );
    const totalXp = onChainCourse
      ? Number(onChainCourse.xp_per_lesson) *
        (Number(onChainCourse.lesson_count) || 1)
      : 0;

    // Fetch user profile for metadata
    const supabase = createAdminClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .single();

    const metadataJson = {
      name: credentialName,
      symbol: "STACAD",
      description: `Certificate of completion for ${courseName} on Superteam Academy.`,
      image: "",
      attributes: [
        { trait_type: "Course", value: courseName },
        {
          trait_type: "Completion Date",
          value: new Date().toISOString().split("T")[0],
        },
        {
          trait_type: "Recipient",
          value: profile?.username ?? walletAddress,
        },
        { trait_type: "Platform", value: "Superteam Academy" },
      ],
      properties: { category: "certificate", creators: [] },
      external_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/certificates`,
      seller_fee_basis_points: 0,
    };

    // Store metadata in Supabase
    const { data: metadataRow, error: metaError } = await supabase
      .from("nft_metadata")
      .insert({ data: metadataJson })
      .select("id")
      .single();

    if (metaError || !metadataRow) {
      throw new Error(metaError?.message ?? "Failed to store NFT metadata");
    }

    const metadataUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/certificates/metadata?id=${metadataRow.id}`;

    let mintSignature: string;
    let mintAddress: PublicKey;
    try {
      const result = await onChainIssueCredential(
        courseId,
        learnerPk,
        credentialName,
        metadataUri,
        1,
        totalXp,
        trackCollectionPubkey
      );
      mintSignature = result.signature;
      mintAddress = result.mintAddress;
    } catch (mintErr) {
      // Clean up orphaned metadata row
      await supabase.from("nft_metadata").delete().eq("id", metadataRow.id);
      throw mintErr;
    }

    // Mirror credential in Supabase certificates table
    const { error: certError } = await supabase.from("certificates").upsert(
      {
        user_id: userId,
        course_id: courseId,
        course_title: courseName,
        mint_address: mintAddress.toBase58(),
        metadata_uri: metadataUri,
        minted_at: new Date().toISOString(),
        tx_signature: mintSignature,
        credential_type: "core",
      },
      { onConflict: "user_id,course_id" }
    );

    if (certError) {
      logError({
        errorId: ERROR_IDS.CERTIFICATE_INSERT_FAILED,
        error: new Error(certError.message),
        context: {
          handler: "tryIssueCredential",
          userId,
          courseId,
          mintAddress: mintAddress.toBase58(),
        },
      });
    }
  } catch (err) {
    await queueFailedAction(
      userId,
      "certificate",
      courseId,
      {
        courseId,
        walletAddress,
      },
      err
    );
  }
}

// ---------------------------------------------------------------------------
// Internal: check achievement eligibility and award on-chain
// ---------------------------------------------------------------------------

async function checkAndAwardAchievements(
  userId: string,
  walletAddress: string,
  supabase: ReturnType<typeof createAdminClient>
): Promise<void> {
  try {
    // Fetch user state from Supabase
    const [
      { data: xpData },
      { data: progressRows },
      { data: existingAchievements },
      { data: enrollmentRows },
    ] = await Promise.all([
      supabase
        .from("user_xp")
        .select(
          "total_xp, level, current_streak, longest_streak, last_activity_date"
        )
        .eq("user_id", userId)
        .single(),
      supabase
        .from("user_progress")
        .select("lesson_id, course_id, completed")
        .eq("user_id", userId)
        .eq("completed", true),
      supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", userId),
      supabase
        .from("enrollments")
        .select("course_id, completed_at")
        .eq("user_id", userId),
    ]);

    const alreadyUnlocked = (existingAchievements ?? []).map(
      (a) => a.achievement_id
    );

    // Count completed lessons per course
    const courseLessonCounts = new Map<string, number>();
    for (const row of progressRows ?? []) {
      courseLessonCounts.set(
        row.course_id,
        (courseLessonCounts.get(row.course_id) ?? 0) + 1
      );
    }

    // Fetch real lesson counts from Sanity
    const [sanityCourseCounts, deployedAchievements] = await Promise.all([
      getAllCourseLessonCounts(),
      getDeployedAchievements(),
    ]);

    const totalLessonsPerCourse = new Map(
      sanityCourseCounts.map((c) => [c._id, c.totalLessons])
    );

    // Determine completed courses
    let completedCourseCount = 0;
    const completedCourseIds = new Set<string>();
    for (const [cid, completedCount] of courseLessonCounts) {
      const total = totalLessonsPerCourse.get(cid);
      if (total && total > 0 && completedCount >= total) {
        completedCourseCount++;
        completedCourseIds.add(cid);
      }
    }

    // Also count courses marked complete via enrollments.completed_at
    for (const row of enrollmentRows ?? []) {
      if (row.completed_at && !completedCourseIds.has(row.course_id)) {
        completedCourseCount++;
        completedCourseIds.add(row.course_id);
      }
    }

    // Determine user number for early-adopter check
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("created_at")
      .eq("id", userId)
      .single();

    const { count: userNumber } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .lte("created_at", userProfile?.created_at ?? new Date().toISOString());

    const newAchievements = checkNewAchievements(
      deployedAchievements,
      {
        completedLessons: progressRows?.length ?? 0,
        completedCourses: completedCourseCount,
        currentStreak: xpData?.current_streak ?? 0,
        hasCompletedRustLesson:
          (courseLessonCounts.get("course-rust-for-solana") ?? 0) >= 1,
        hasCompletedAnchorCourse: completedCourseIds.has(
          "course-anchor-framework"
        ),
        hasCompletedAllTracks: SOLANA_DEV_PATH_COURSES.every((id) =>
          completedCourseIds.has(id)
        ),
        courseCompletionTimeHours: null,
        allTestsPassedFirstTry: false,
        userNumber: userNumber ?? 999,
        totalThreads: 0,
        totalAnswers: 0,
        acceptedAnswers: 0,
        totalCommunityXp: 0,
      },
      alreadyUnlocked
    );

    // Award each new achievement on-chain
    const recipientPk = new PublicKey(walletAddress);
    for (const achievement of newAchievements) {
      try {
        await onChainAwardAchievement(achievement.id, recipientPk);
      } catch (err) {
        await queueFailedAction(
          userId,
          "achievement",
          achievement.id,
          {
            achievementId: achievement.id,
            walletAddress,
          },
          err
        );
      }
    }
  } catch (err) {
    logError({
      errorId: ERROR_IDS.ACHIEVEMENT_ONCHAIN_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: {
        handler: "checkAndAwardAchievements",
        userId,
        walletAddress,
      },
    });
  }
}
