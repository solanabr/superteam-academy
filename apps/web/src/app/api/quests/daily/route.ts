import { NextResponse } from "next/server";
import type { DailyQuest } from "@superteam-lms/types";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAllQuests } from "@/lib/sanity/queries";
import { queueFailedOnchainAction } from "@/lib/solana/onchain-queue";
import { nextMidnightUtc } from "@/lib/gamification/daily-reset";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";

// Auth/cookie + per-request DB access — never statically prerender (DYNAMIC_SERVER_USAGE).
export const dynamic = "force-dynamic";

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
        nextResetTime: nextMidnightUtc(),
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
    const progressRows =
      (progressData as Array<{
        questId: string;
        currentValue: number;
        completed: boolean;
        justAwarded: boolean;
        xpReward: number;
      }>) ?? [];

    const progressMap = new Map<
      string,
      { currentValue: number; completed: boolean }
    >();
    for (const row of progressRows) {
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

    // 6. Durably record the on-chain XP mint intent for newly-completed quests.
    //
    // get_daily_quest_state already flipped xp_granted=true ("attempt
    // authorized"), so a dropped mint is PERMANENT XP loss. The mint therefore
    // must not be fire-and-forget: on Vercel the lambda freezes once the
    // response returns, killing any un-awaited work. Instead we write the
    // pending_onchain_actions row SYNCHRONOUSLY (durable) BEFORE responding;
    // retryPendingOnchainActions() — driven on the user's next auth — performs
    // the actual on-chain mint (it resolves the wallet and checks program
    // liveness itself, so no wallet / program-live gating is needed here).
    const newlyAwarded = progressRows.filter(
      (r) => r.justAwarded && r.xpReward > 0
    );
    if (newlyAwarded.length > 0) {
      await enqueueQuestXpMints(user.id, newlyAwarded);
    }

    return NextResponse.json({
      quests,
      nextResetTime: nextMidnightUtc(),
    });
  } catch (err) {
    console.error("[api/quests/daily] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Durable enqueue: record quest-XP mint intents for the retry queue
// ---------------------------------------------------------------------------

async function enqueueQuestXpMints(
  userId: string,
  awarded: Array<{ questId: string; xpReward: number }>
): Promise<void> {
  // Reference_id is scoped to the UTC day (matching CURRENT_DATE, which
  // get_daily_quest_state uses for period_start on the Supabase UTC instance).
  // Without the day suffix, day-N's enqueue would upsert-collide with a prior
  // day's already-resolved row and the mint would be silently dropped.
  const periodKey = new Date().toISOString().slice(0, 10);

  // Enqueue every award; a failed enqueue means the durable intent was NOT
  // recorded (xp_granted is already true → XP-loss case), so surface it loudly
  // per-quest rather than letting one failure abort the others.
  await Promise.all(
    awarded.map(async (quest) => {
      try {
        await queueFailedOnchainAction(
          userId,
          "quest_xp",
          `${quest.questId}:${periodKey}`,
          { xpAmount: quest.xpReward, memo: `daily_quest:${quest.questId}` }
        );
      } catch (err) {
        logError({
          errorId: ERROR_IDS.XP_REWARD_FAILED,
          error: err instanceof Error ? err : new Error(String(err)),
          context: {
            handler: "enqueueQuestXpMints",
            userId,
            questId: quest.questId,
            xpReward: quest.xpReward,
          },
        });
      }
    })
  );
}
