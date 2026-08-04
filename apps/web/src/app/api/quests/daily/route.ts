import { NextResponse, after } from "next/server";
import type { DailyQuest } from "@superteam-lms/types";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAllQuests } from "@/lib/content/queries";
import { retryQuestXpForUser } from "@/lib/gamification/xp-queue-settlement";
import {
  nextMidnightUtc,
  questPeriodUtc,
} from "@/lib/gamification/daily-reset";
import {
  evaluateQuests,
  type QuestProgressRow,
} from "@/lib/gamification/quest-evaluation";
import { serverEnv } from "@/lib/env.server";

// Auth/cookie + per-request DB access — never statically prerender (DYNAMIC_SERVER_USAGE).
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !serverEnv.SUPABASE_SERVICE_ROLE_KEY
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

    // 1. Quest definitions from the content bundle. This route needs the
    //    DISPLAY fields (name/description/icon) that the shared evaluator does
    //    not return; both read the same cached bundle.
    const questData = await getAllQuests();

    if (questData.quests.length === 0) {
      return NextResponse.json({
        quests: [],
        nextResetTime: nextMidnightUtc(),
        questPeriod: questPeriodUtc(),
      });
    }

    // 2. Evaluate + award through the SHARED implementation
    //    (lib/gamification/quest-evaluation) — byte-identical to what the
    //    lesson-complete / review-grade / test-out paths now run after a
    //    quest-relevant action, so the panel and the action paths can never
    //    drift apart. The RPC's own xp_granted guard makes the overlap safe.
    const admin = createAdminClient();
    let progressRows: QuestProgressRow[];
    try {
      progressRows = await evaluateQuests(admin, user.id);
    } catch (err) {
      console.error(
        "[api/quests/daily] RPC error:",
        err instanceof Error ? err.message : String(err)
      );
      return NextResponse.json(
        { error: "Failed to load quest progress" },
        { status: 500 }
      );
    }

    // 3. Merge content display fields with the evaluated progress
    const progressMap = new Map<
      string,
      { currentValue: number; completed: boolean; justAwarded: boolean }
    >();
    for (const row of progressRows) {
      progressMap.set(row.questId, {
        currentValue: row.currentValue,
        completed: row.completed,
        // #790: surface the one-shot award signal so the client can toast it.
        justAwarded: row.justAwarded,
      });
    }

    const quests: DailyQuest[] = questData.quests.map((q) => {
      const progress = progressMap.get(q.id);
      return {
        id: q.id,
        type: q.type,
        name: q.name,
        description: q.description,
        icon: q.icon,
        xpReward: q.xpReward,
        targetValue: q.targetValue,
        currentValue: progress?.currentValue ?? 0,
        completed: progress?.completed ?? false,
        resetType: q.resetType,
        justAwarded: progress?.justAwarded ?? false,
      };
    });

    // 4. XP delivery is durable by construction: get_daily_quest_state writes
    // the pending_onchain_actions row in the SAME transaction that flips
    // xp_granted=true, so a quest is never marked granted without a durable
    // pending row. Nothing to enqueue here — doing it in the route would leave
    // a window where xp_granted stands without a row.
    //
    // 5. Deliver this user's pending quest_xp credits NOW. The auth-time
    // retryPendingOnchainActions() only runs on re-auth, so a permanently
    // logged-in session would otherwise never get its enqueued rows swept.
    // Idempotent (award_xp keyed on reference_id), DB-only, so awaiting is
    // cheap. Errors never fail the endpoint — rows stay durable for the next
    // sweep.
    // Off the response path (dashboard-latency fix, 2026-08-01): the sweep is
    // idempotent and durable, so the response never needs to wait for it. It
    // still runs on every GET — just after the reply is flushed.
    after(async () => {
      try {
        await retryQuestXpForUser(admin, user.id);
      } catch (err) {
        console.error("[api/quests/daily] quest_xp sweep failed:", err);
      }
    });

    return NextResponse.json({
      quests,
      nextResetTime: nextMidnightUtc(),
      // The SERVER's name for today's quest period (UTC, matching the DB's
      // CURRENT_DATE). The client uses it as the toast dedupe key, so the poll
      // path and the Realtime path agree on the period even when the learner's
      // LOCAL date differs from UTC (a São Paulo evening is already tomorrow in
      // UTC) — a client-derived date would silently break the shared dedupe.
      questPeriod: questPeriodUtc(),
    });
  } catch (err) {
    console.error("[api/quests/daily] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
