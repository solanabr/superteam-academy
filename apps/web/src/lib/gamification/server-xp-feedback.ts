import type { DailyQuest } from "@superteam-lms/types";
import { isSurpriseBonusReason } from "@/lib/gamification/surprise-bonus";

// #790: server-granted XP (daily-quest rewards, surprise bonuses) lands with no
// synchronous UI cause — the owner couldn't tell why the numbers moved. These
// helpers decide, from the data the dashboard ALREADY polls (/api/quests/daily's
// justAwarded + the recent xp_transactions), which rewards to toast, exactly
// once.
//
// Two different server semantics ⇒ two dedupe strategies:
//
//   * QUESTS use `justAwarded`, which the server flips false after the first
//     poll (get_daily_quest_state). So a plain in-memory Set keyed on
//     questId+period is enough — a reload re-polls and simply gets justAwarded
//     false, never re-toasting.
//
//   * SURPRISE BONUSES are permanent xp_transactions rows with no one-shot
//     flag, so a poll that re-scans recent transactions would re-toast them on
//     every reload. Their seen-set is therefore persisted in sessionStorage
//     (survives reload within the tab) and SEEDED SILENTLY on the first
//     observation in a tab: existing bonuses are marked seen without toasting
//     (they are history the learner didn't just earn); only bonuses that appear
//     on a LATER poll toast. The same set is SHARED with the Realtime path
//     (use-gamification-events) via claimSurpriseBonus, so whichever channel
//     sees an award first fires the toast and the other is a no-op.

// ── Quests ──────────────────────────────────────────────────────────────────

const firedQuestKeys = new Set<string>();

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

// ── Surprise bonuses (sessionStorage-backed, seeded silently) ─────────────────

const SURPRISE_SEEN_KEY = "stbr:surprise-bonus-seen";
const SURPRISE_INIT_KEY = "stbr:surprise-bonus-init";

// The seen-set and init flag are keyed by the authenticated user id. Sign-out
// hard-navigates without clearing sessionStorage, so a same-tab account switch
// would otherwise let the new user inherit the previous user's init flag and
// storm them with their OWN entire surprise-bonus history. A per-user namespace
// means an unseen user id has no init flag → it seeds silently, exactly like a
// fresh tab. An absent id (SSR / anonymous) collapses to a single "" namespace,
// preserving the original single-user behaviour byte-for-byte.
function ns(userId?: string): string {
  return userId ?? "";
}
function seenStorageKey(userId?: string): string {
  return `${SURPRISE_SEEN_KEY}:${ns(userId)}`;
}
function initStorageKey(userId?: string): string {
  return `${SURPRISE_INIT_KEY}:${ns(userId)}`;
}

// In-memory fallback for SSR / non-DOM test env (sessionStorage absent), also
// namespaced per user id.
const memSeen = new Map<string, Set<string>>();
const memInit = new Set<string>();

function memSeenSet(userId?: string): Set<string> {
  let set = memSeen.get(ns(userId));
  if (!set) {
    set = new Set<string>();
    memSeen.set(ns(userId), set);
  }
  return set;
}

function store(): Storage | null {
  try {
    return typeof window !== "undefined" && window.sessionStorage
      ? window.sessionStorage
      : null;
  } catch {
    return null;
  }
}

function readSeen(userId?: string): Set<string> {
  const s = store();
  if (!s) return memSeenSet(userId);
  try {
    const raw = s.getItem(seenStorageKey(userId));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return memSeenSet(userId);
  }
}

function writeSeen(seen: Set<string>, userId?: string): void {
  const s = store();
  if (!s) return;
  try {
    // Cap so the store can't grow without bound over a long session.
    s.setItem(seenStorageKey(userId), JSON.stringify([...seen].slice(-200)));
  } catch {
    // Storage full / disabled — the in-memory set still dedupes this session.
  }
}

function hasInitialized(userId?: string): boolean {
  const s = store();
  if (!s) return memInit.has(ns(userId));
  return s.getItem(initStorageKey(userId)) === "1";
}

function markInitialized(seen: Set<string>, userId?: string): void {
  const s = store();
  if (!s) {
    memInit.add(ns(userId));
    return;
  }
  writeSeen(seen, userId);
  try {
    s.setItem(initStorageKey(userId), "1");
  } catch {
    memInit.add(ns(userId));
  }
}

/**
 * True the first time this surprise-bonus award key is claimed; marks it seen.
 * Namespaced by user id so the seen-set is never shared across a same-tab
 * account switch.
 */
export function claimSurpriseBonus(key: string, userId?: string): boolean {
  if (!key) return false;
  const seen = readSeen(userId);
  if (seen.has(key)) return false;
  seen.add(key);
  writeSeen(seen, userId);
  return true;
}

/** A recent xp_transactions row, as the dashboard poll selects it. */
export interface XpTransactionRow {
  reason: string | null;
  amount: number | null;
  idempotency_key?: string | null;
  tx_signature?: string | null;
  created_at?: string | null;
}

function surpriseKey(r: XpTransactionRow): string {
  // KEEP IN SYNC with the inline key in use-gamification-events.ts: both
  // channels share claimSurpriseBonus's seen-set, so they must derive the SAME
  // key for the same award. maybeAwardSurpriseBonus always sets
  // idempotency_key, so the fallback below is dead today — but if it ever
  // becomes optional, both sites' fallbacks must stay aligned or a bonus would
  // toast twice (once per path).
  return r.idempotency_key ?? `${r.tx_signature ?? ""}:${r.created_at ?? ""}`;
}

/**
 * The surprise-bonus amounts to toast from a recent-transactions scan. On the
 * FIRST observation in a tab, seeds existing bonuses as seen and toasts nothing
 * (they are history); on later polls, toasts each newly-appeared bonus once.
 * Deduped (sessionStorage) so a reload never re-toasts, and shared with the
 * Realtime path via claimSurpriseBonus.
 */
export function pickSurpriseBonusToasts(
  rows: readonly XpTransactionRow[],
  userId?: string
): number[] {
  const bonuses = rows.filter(
    (r) =>
      r.reason != null &&
      isSurpriseBonusReason(r.reason) &&
      r.amount != null &&
      r.amount > 0
  );

  if (!hasInitialized(userId)) {
    const seen = readSeen(userId);
    for (const r of bonuses) seen.add(surpriseKey(r));
    markInitialized(seen, userId);
    return [];
  }

  const out: number[] = [];
  for (const r of bonuses) {
    if (claimSurpriseBonus(surpriseKey(r), userId))
      out.push(r.amount as number);
  }
  return out;
}

/** Test-only: clear both the quest and surprise session dedupe state. */
export function __resetServerXpFeedbackForTests(): void {
  firedQuestKeys.clear();
  memSeen.clear();
  memInit.clear();
  const s = store();
  if (s) {
    try {
      // Keys are per-user namespaced, so remove every surprise-bonus entry.
      const doomed: string[] = [];
      for (let i = 0; i < s.length; i++) {
        const k = s.key(i);
        if (
          k &&
          (k.startsWith(SURPRISE_SEEN_KEY) || k.startsWith(SURPRISE_INIT_KEY))
        ) {
          doomed.push(k);
        }
      }
      for (const k of doomed) s.removeItem(k);
    } catch {
      // ignore
    }
  }
}
