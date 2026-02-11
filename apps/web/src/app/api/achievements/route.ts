import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  checkNewAchievements,
  isAchievementId,
} from "@/lib/gamification/achievements";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { achievementId: string };
    const { achievementId } = body;

    if (!achievementId || !isAchievementId(achievementId)) {
      return NextResponse.json(
        { error: "Invalid achievement ID" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Check if already unlocked
    const { data: existing } = await supabaseAdmin
      .from("user_achievements")
      .select("id")
      .eq("user_id", user.id)
      .eq("achievement_id", achievementId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, alreadyUnlocked: true });
    }

    // Verify the user has actually earned this achievement
    const { data: xpData } = await supabaseAdmin
      .from("user_xp")
      .select("total_xp, current_streak")
      .eq("user_id", user.id)
      .single();

    const { data: progressRows } = await supabaseAdmin
      .from("user_progress")
      .select("lesson_id, course_id")
      .eq("user_id", user.id)
      .eq("completed", true);

    const completedLessonCount = progressRows?.length ?? 0;
    const completedLessonIds = (progressRows ?? []).map((r) => r.lesson_id);

    const courseLessonCounts = new Map<string, number>();
    for (const row of progressRows ?? []) {
      courseLessonCounts.set(
        row.course_id,
        (courseLessonCounts.get(row.course_id) ?? 0) + 1
      );
    }
    const completedCourseCount = Array.from(courseLessonCounts.values()).filter(
      (count) => count >= 3
    ).length;

    const { data: existingAchievements } = await supabaseAdmin
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", user.id);

    const alreadyUnlocked = (existingAchievements ?? []).map(
      (a) => a.achievement_id
    );

    const earned = checkNewAchievements(
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
        hasCompletedAllTracks: false,
        courseCompletionTimeHours: null,
        allTestsPassedFirstTry: false,
        userNumber: 1,
      },
      alreadyUnlocked
    );

    const isEarned = earned.some((a) => a.id === achievementId);

    if (!isEarned) {
      return NextResponse.json(
        { error: "Achievement requirements not met" },
        { status: 403 }
      );
    }

    const { error } = await supabaseAdmin.rpc("unlock_achievement", {
      p_user_id: user.id,
      p_achievement_id: achievementId,
    });

    if (error) {
      return NextResponse.json(
        { error: "Failed to unlock achievement" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, achievementId });
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.ACHIEVEMENT_UNLOCK_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { route: "/api/achievements" },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
