import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkNewAchievements } from "@/lib/gamification/achievements";
import { getAllCourseLessonCounts, getCourseById } from "@/lib/sanity/queries";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";
import {
  isOnChainProgramLive,
  completeLesson as onChainCompleteLesson,
  finalizeCourse as onChainFinalizeCourse,
  getConnection,
  PROGRAM_ID,
} from "@/lib/solana/academy-program";
import { fetchEnrollment, fetchCourse } from "@/lib/solana/academy-reads";
import { isAllLessonsComplete } from "@/lib/solana/bitmap";

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
      .select("wallet_address")
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
        xpReward = (onChainCourse.xpPerLesson as number) ?? 10;
      }

      // Derive lesson index from Sanity content order
      lessonIndex = await deriveLessonIndex(courseId, lessonId);

      // Call on-chain completeLesson — backend signs, mints XP via CPI
      onChainSignature = await onChainCompleteLesson(
        courseId,
        walletPubkey,
        lessonIndex
      );

      // Check if all lessons are now complete for auto-finalize
      const onChainEnrollment = await fetchEnrollment(
        courseId,
        walletPubkey,
        connection,
        PROGRAM_ID
      );

      if (onChainEnrollment && onChainCourse) {
        const totalLessons = (onChainCourse.lessonCount as number) ?? 0;

        if (
          isAllLessonsComplete(
            onChainEnrollment.lessonFlags as (bigint | number)[],
            totalLessons
          ) &&
          !onChainEnrollment.completedAt
        ) {
          try {
            finalizeSig = await onChainFinalizeCourse(courseId, walletPubkey);
            finalized = true;
          } catch (err) {
            logError({
              errorId: ERROR_IDS.COURSE_FINALIZE_FAILED,
              error: err instanceof Error ? err : new Error(String(err)),
              context: { note: "auto-finalize failed, can retry" },
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

    // Award XP via SECURITY DEFINER function (also handles streak in SQL)
    const { error: xpError } = await supabaseAdmin.rpc("award_xp", {
      p_user_id: user.id,
      p_amount: xpReward,
      p_reason: `Completed lesson: ${lessonId}`,
    });

    if (xpError) {
      return NextResponse.json(
        { error: "Failed to award XP" },
        { status: 500 }
      );
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
    // Fetch real lesson counts from Sanity to accurately detect course completion
    const sanityCourseCounts = await getAllCourseLessonCounts();
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
        hasCompletedAllTracks: false,
        courseCompletionTimeHours: null,
        allTestsPassedFirstTry: false,
        userNumber: userNumber ?? 999,
      },
      alreadyUnlocked
    );

    // 7. Unlock new achievements (accumulate errors instead of ignoring them)
    const achievementErrors: { id: string; error: string }[] = [];
    const successfullyUnlocked: typeof newAchievements = [];

    for (const achievement of newAchievements) {
      const { error: unlockError } = await supabaseAdmin.rpc(
        "unlock_achievement",
        {
          p_user_id: user.id,
          p_achievement_id: achievement.id,
        }
      );

      if (unlockError) {
        achievementErrors.push({
          id: achievement.id,
          error: unlockError.message,
        });
        logError({
          errorId: ERROR_IDS.LESSON_ACHIEVEMENT_UNLOCK,
          error: new Error(unlockError.message),
          context: { userId: user.id, achievementId: achievement.id },
        });
      } else {
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
