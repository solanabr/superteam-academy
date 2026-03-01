import { NextResponse } from "next/server";
import type { DailyQuest } from "@superteam-lms/types";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAllQuests } from "@/lib/sanity/queries";

export async function GET() {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
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

    // 1. Fetch quest definitions + auxiliary data from Sanity (single round trip)
    const questData = await getAllQuests();

    if (questData.quests.length === 0) {
      return NextResponse.json({
        quests: [],
        nextResetTime: getNextMidnightUTC(),
      });
    }

    // 2. Normalize quest definitions into the shape expected by the SQL function
    const questDefs = questData.quests.map((q) => ({
      id: q.id,
      type: q.type,
      xpReward: q.xpReward,
      targetValue: q.targetValue,
      resetType: q.resetType,
    }));

    // 3. Build module lesson map as { id, lessonIds }[]
    const moduleLessonMap = questData.moduleLessonMap.map((m) => ({
      id: m.id,
      lessonIds: m.lessonIds,
    }));

    // 4. Call the SQL function via admin client
    const admin = createAdminClient();
    const { data: progressData, error: rpcError } = await admin.rpc(
      "get_daily_quest_state",
      {
        p_user_id: user.id,
        p_quest_definitions: questDefs,
        p_challenge_ids: questData.challengeLessonIds,
        p_module_lesson_map: moduleLessonMap,
      }
    );

    if (rpcError) {
      console.error("[api/quests/daily] RPC error:", rpcError.message);
      return NextResponse.json(
        { error: "Failed to load quest progress" },
        { status: 500 }
      );
    }

    // 5. Merge Sanity display fields with Supabase progress
    const progressMap = new Map<
      string,
      { currentValue: number; completed: boolean }
    >();
    for (const row of (progressData as Array<{
      questId: string;
      currentValue: number;
      completed: boolean;
    }>) ?? []) {
      progressMap.set(row.questId, {
        currentValue: row.currentValue,
        completed: row.completed,
      });
    }

    const quests: DailyQuest[] = questData.quests.map((q) => {
      const progress = progressMap.get(q.id);
      return {
        id: q.id,
        name: q.name,
        description: q.description,
        icon: q.icon,
        xpReward: q.xpReward,
        targetValue: q.targetValue,
        currentValue: progress?.currentValue ?? 0,
        completed: progress?.completed ?? false,
        resetType: q.resetType,
      };
    });

    return NextResponse.json({
      quests,
      nextResetTime: getNextMidnightUTC(),
    });
  } catch (err) {
    console.error("[api/quests/daily] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getNextMidnightUTC(): string {
  const now = new Date();
  const next = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0
    )
  );
  return next.toISOString();
}
