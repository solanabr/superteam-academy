import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkNewAchievements } from "@/lib/gamification/achievements";
import { getAllCourseLessonCounts } from "@/lib/sanity/queries";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";
import { mintXpToWallet } from "@/lib/solana/xp-mint";

interface LessonCompleteRequest {
  lessonId: string;
  courseId: string;
  xpReward: number;
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
    const { lessonId, courseId, xpReward } = body;

    if (!lessonId || !courseId || !xpReward || xpReward <= 0) {
      return NextResponse.json(
        { error: "Missing or invalid lessonId, courseId, or xpReward" },
        { status: 400 }
      );
    }

    if (xpReward > 100) {
      return NextResponse.json(
        { error: "XP amount exceeds maximum" },
        { status: 400 }
      );
    }

    // Create admin client for SECURITY DEFINER functions
    const supabaseAdmin = createAdminClient();

    // 1. Verify user is enrolled in this course
    const { data: enrollment } = await supabaseAdmin
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .single();

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    // 2. Check if lesson is already completed (prevent double-awarding)
    const { data: existing } = await supabaseAdmin
      .from("user_progress")
      .select("id, completed")
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId)
      .single();

    if (existing?.completed) {
      return NextResponse.json({
        success: true,
        alreadyCompleted: true,
        xpEarned: 0,
        newAchievements: [],
        streakData: null,
      });
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
        },
        { onConflict: "user_id,lesson_id" }
      );

    if (progressError) {
      return NextResponse.json(
        { error: "Failed to save progress" },
        { status: 500 }
      );
    }

    // 4. Award XP via SECURITY DEFINER function (also handles streak in SQL)
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

    // 4b. Mint Token-2022 XP on-chain (awaited to capture signature for response)
    // Look up user's wallet address; only mint if they have one connected
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("wallet_address")
      .eq("id", user.id)
      .single();

    let onChainMintSignature: string | undefined;

    if (profile?.wallet_address) {
      const mintResult = await mintXpToWallet(profile.wallet_address, xpReward);
      if (mintResult.success) {
        onChainMintSignature = mintResult.signature;
      } else if (mintResult.error) {
        logError({
          errorId: ERROR_IDS.LESSON_COMPLETE_FAILED,
          error: new Error(`On-chain XP mint failed: ${mintResult.error}`),
          context: { userId: user.id, walletAddress: profile.wallet_address },
        });
      }
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

    const newAchievements = checkNewAchievements(
      {
        completedLessons: completedLessonCount,
        completedCourses: completedCourseCount,
        currentStreak: xpData?.current_streak ?? 0,
        hasCompletedRustLesson: completedLessonIds.some((id) =>
          id.includes("rust")
        ),
        hasCompletedAnchorCourse: completedLessonIds.some((id) =>
          id.includes("anchor")
        ),
        hasCompletedAllTracks: false, // Would need learning path data
        courseCompletionTimeHours: null, // Would need timestamp tracking
        allTestsPassedFirstTry: false, // Would need test attempt tracking
        userNumber: 1, // Early adopter - would need profile count
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
      onChainMintSignature,
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
