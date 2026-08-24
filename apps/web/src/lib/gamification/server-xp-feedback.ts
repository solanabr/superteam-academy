import type { DailyQuest } from "@superteam-lms/types";

// #790: server-granted daily-quest XP lands with no synchronous UI cause — the
// owner couldn't tell why the numbers moved. These helpers decide, from the data
// the dashboard ALREADY has (/api/quests/daily's justAwarded), which rewards to
// celebrate, exactly once.
//
// Quests use `justAwarded`, which the server flips false after the first poll
// (get_daily_quest_state), so a plain in-memory Set keyed on questId+period is
// enough — a reload re-polls and simply gets justAwarded false, never
// re-celebrating.
//
// The surprise bonus (LX-B15) had a second, sessionStorage-backed seen-set here.
// The feature was removed outright on 2026-08-24 and its dedupe with it.
// Historical `surprise_bonus:` rows are read-only history now: the dashboard
// activity feed still labels them, and nothing celebrates them.

// ── Quests ──────────────────────────────────────────────────────────────────

const firedQuestKeys = new Set<string>();

// Namespaced by the authenticated user id so a same-tab account switch never
// lets a new user inherit the previous user's fired keys. An absent id (SSR /
// anonymous) collapses to a single "" namespace.
function ns(userId?: string): string {
  return userId ?? "";
}

/**
 * True the first time (questId, period) is claimed this session; marks it seen.
 * Namespaced by the authenticated user id so a same-tab account switch never
 * lets a new user inherit the previous user's fired keys.
 */
export function claimQuestReward(
  questId: string,
  period: string,
  userId?: string
): boolean {
  const key = `${ns(userId)}:${questId}:${period}`;
  if (firedQuestKeys.has(key)) return false;
  firedQuestKeys.add(key);
  return true;
}

/** The `xp_transactions.reason` prefix every daily-quest credit carries. */
export const QUEST_XP_REASON_PREFIX = "daily_quest:";

/**
 * Claim a quest reward observed as an XP CREDIT (the Realtime
 * `xp_transactions` INSERT), against the SAME session-wide seen-set the poll
 * path uses. Returns the quest id on the first observation, `null` when this
 * (quest, period) was already toasted by either channel.
 *
 * Why this exists (the double-toast hazard): since quest evaluation now fires
 * from the ACTION paths, an award can be observed twice, moments apart —
 *   • by the dashboard poll, via `justAwarded` on the call that granted it, and
 *   • by Realtime, when the queued credit lands in xp_transactions.
 * Both funnel through `claimQuestReward`, so whichever arrives first toasts and
 * the other is a no-op. That only holds if both derive the SAME key, hence the
 * period rules below.
 *
 * PERIOD DERIVATION — keep aligned with the poll path, which uses the server's
 * `questPeriod` (UTC, = the DB's CURRENT_DATE):
 *   1. `idempotency_key` is the queue row's reference_id, `<questId>:<period>`,
 *      written by get_daily_quest_state. It is authoritative — prefer it.
 *   2. Else the row's `created_at` UTC date (the credit landed that day).
 *   3. Else today's UTC date.
 * Never the browser's LOCAL date: a São Paulo evening (UTC-3) is already the
 * next UTC day, and the two channels would then key differently and both toast.
 */
export function claimQuestRewardFromCredit(
  row: {
    reason?: string | null;
    idempotency_key?: string | null;
    created_at?: string | null;
  },
  userId?: string
): string | null {
  if (!row.reason?.startsWith(QUEST_XP_REASON_PREFIX)) return null;
  const questId = row.reason.slice(QUEST_XP_REASON_PREFIX.length);
  if (!questId) return null;

  return claimQuestReward(questId, questPeriodOf(row, questId), userId)
    ? questId
    : null;
}

function questPeriodOf(
  row: { idempotency_key?: string | null; created_at?: string | null },
  questId: string
): string {
  const prefix = `${questId}:`;
  if (row.idempotency_key?.startsWith(prefix)) {
    return row.idempotency_key.slice(prefix.length);
  }
  if (row.created_at) {
    const at = new Date(row.created_at);
    if (!Number.isNaN(at.getTime())) return at.toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

export interface QuestRewardToast {
  questId: string;
  name: string;
  xpReward: number;
}

/**
 * The quests whose XP was just awarded on THIS poll and not yet toasted this
 * session. A re-poll (justAwarded already false, or the key already claimed)
 * yields nothing.
 */
export function pickQuestRewardToasts(
  quests: readonly DailyQuest[],
  period: string,
  userId?: string
): QuestRewardToast[] {
  const out: QuestRewardToast[] = [];
  for (const q of quests) {
    if (q.justAwarded && claimQuestReward(q.id, period, userId)) {
      out.push({ questId: q.id, name: q.name, xpReward: q.xpReward });
    }
  }
  return out;
}

/** Test-only: clear the quest session dedupe state. */
export function __resetServerXpFeedbackForTests(): void {
  firedQuestKeys.clear();
}
