import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAllQuests } from "@/lib/content/queries";
import { retryQuestXpForUser } from "@/lib/solana/onchain-queue";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Daily-quest evaluation — the ONE server-side implementation.
 *
 * Before this module, `get_daily_quest_state` (which both EVALUATES progress and
 * AWARDS the XP for a newly-completed quest) was invoked from exactly one place:
 * `GET /api/quests/daily`, whose only real caller is the dashboard hook. A
 * learner who finished lessons, passed challenges, or cleared reviews without
 * opening the dashboard therefore earned quest XP late — or never, for a session
 * that never landed on /dashboard. This module lets the ACTION paths
 * (lesson complete, test-out batch, review grade, the Helius completion webhook)
 * run the same evaluation at the moment the quest-relevant thing happens, while
 * the dashboard GET keeps working unchanged for the panel.
 *
 * Idempotency is the RPC's, not ours: it flips `xp_granted` false→true under a
 * `WHERE xp_granted = false` guard and enqueues the credit in the SAME
 * transaction, so calling it N times a day awards a quest exactly once — the
 * later calls simply report `justAwarded: false`. That is what makes it safe to
 * fire from several paths (see `__tests__/quest-evaluation.test.ts`).
 *
 * DAY SEMANTICS UNCHANGED: nothing here passes a date. The RPC keys everything
 * on `CURRENT_DATE` (UTC) exactly as before; we only change WHEN it is called.
 */

/** One row of `get_daily_quest_state`'s JSONB result. */
export interface QuestProgressRow {
  questId: string;
  currentValue: number;
  completed: boolean;
  /** True on the single call that flipped `xp_granted` false→true. */
  justAwarded: boolean;
  xpReward: number;
}

/**
 * Evaluate every active quest for `userId` and award any that just completed.
 * Throws on RPC failure so a caller that owns a response (the GET route) can
 * surface a 500; the fire-and-forget trigger below swallows and logs instead.
 */
export async function evaluateQuests(
  admin: AdminClient,
  userId: string
): Promise<QuestProgressRow[]> {
  const questData = await getAllQuests();
  if (questData.quests.length === 0) return [];

  const { data, error } = await admin.rpc("get_daily_quest_state", {
    p_user_id: userId,
    p_quest_definitions: questData.quests.map((q) => ({
      id: q.id,
      type: q.type,
      xpReward: q.xpReward,
      targetValue: q.targetValue,
      resetType: q.resetType,
    })),
    p_challenge_ids: questData.challengeLessonIds,
    p_module_lesson_map: questData.moduleLessonMap.map((m) => ({
      id: m.id,
      lessonIds: m.lessonIds,
    })),
  });

  if (error) throw new Error(error.message);
  return (data as QuestProgressRow[] | null) ?? [];
}

/**
 * Evaluate + DELIVER: run the evaluation, then sweep this learner's pending
 * `quest_xp` rows so the XP actually lands in `xp_transactions` now.
 *
 * The two halves have different durability stories and both matter:
 *   • The AWARD is durable by construction — the RPC writes the
 *     `pending_onchain_actions` row inside the same transaction that flips
 *     `xp_granted`, so a quest can never be marked granted without a queue row.
 *   • The DELIVERY (award_xp) is idempotent on `reference_id`, so re-sweeping an
 *     already-credited row is a no-op, and an undelivered row is simply picked up
 *     by the next sweep (this one, the dashboard GET, or the login drain).
 * A sweep failure is therefore never a lost reward — only a delayed one.
 */
export async function runQuestEvaluation(
  userId: string
): Promise<QuestProgressRow[]> {
  const admin = createAdminClient();
  const rows = await evaluateQuests(admin, userId);
  await retryQuestXpForUser(admin, userId);
  return rows;
}

/**
 * Fire quest evaluation for a learner WITHOUT delaying the response.
 *
 * Call this from any server path that just made a quest-relevant change
 * (a completed lesson, a graded review pass, a batched test-out). It runs in
 * Next's `after()` continuation — the work is scheduled as part of the request
 * and executed once the response has been sent, so the hot lesson-completion
 * path pays no added latency but the call is still owned by the platform rather
 * than left as a floating promise the runtime may kill mid-flight.
 *
 * `after()` throws outside a request scope (scripts, cron-less invocations,
 * unit tests). The catch there degrades to an awaited-nowhere promise with the
 * same error logging rather than crashing the caller — never to silence: every
 * failure mode below reaches `logError`.
 *
 * Nothing is dropped silently, and nothing is lost even if it is: an
 * unevaluated quest is re-evaluated by the next action, the next dashboard
 * poll, or the next login sweep. This changes reward TIMING, never the award.
 */
export function scheduleQuestEvaluation(userId: string): void {
  const run = async (): Promise<void> => {
    try {
      await runQuestEvaluation(userId);
    } catch (err) {
      logError({
        errorId: ERROR_IDS.QUEST_EVALUATION_FAILED,
        error: err instanceof Error ? err : new Error(String(err)),
        context: { step: "scheduled_quest_evaluation", userId },
      });
    }
  };

  try {
    after(run);
  } catch {
    void run();
  }
}
