import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import type { DailyQuest } from "@superteam-lms/types";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAllQuests } from "@/lib/sanity/queries";
import { rewardXp, isOnChainProgramLive } from "@/lib/solana/academy-program";
import { queueFailedOnchainAction } from "@/lib/solana/onchain-queue";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";

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

    // 6. Mint XP on-chain for newly-completed quests (fire-and-forget)
    const newlyAwarded = progressRows.filter(
      (r) => r.justAwarded && r.xpReward > 0
    );
    if (newlyAwarded.length > 0) {
      mintQuestXpOnChain(user.id, newlyAwarded, admin).catch(() => {
        // Errors are logged + queued inside mintQuestXpOnChain
      });
    }

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

// ---------------------------------------------------------------------------
// Fire-and-forget: mint quest XP tokens on-chain
// ---------------------------------------------------------------------------

async function mintQuestXpOnChain(
  userId: string,
  awarded: Array<{ questId: string; xpReward: number }>,
  admin: ReturnType<typeof createAdminClient>
): Promise<void> {
  // Check if program is live before attempting on-chain calls
  const programLive = await isOnChainProgramLive();
  if (!programLive) return;

  // Resolve the user's wallet address
  const { data: profile } = await admin
    .from("profiles")
    .select("wallet_address")
    .eq("id", userId)
    .single();

  if (!profile?.wallet_address) return;

  const wallet = new PublicKey(profile.wallet_address);

  for (const quest of awarded) {
    const memo = `daily_quest:${quest.questId}`;
    try {
      await rewardXp(wallet, quest.xpReward, memo);
    } catch (err) {
      logError({
        errorId: ERROR_IDS.XP_REWARD_FAILED,
        error: err instanceof Error ? err : new Error(String(err)),
        context: {
          handler: "mintQuestXpOnChain",
          userId,
          questId: quest.questId,
          xpReward: quest.xpReward,
        },
      });

      await queueFailedOnchainAction(
        userId,
        "quest_xp",
        quest.questId,
        {
          xpAmount: quest.xpReward,
          memo,
          walletAddress: profile.wallet_address,
        },
        err instanceof Error ? err.message : String(err)
      );
    }
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
