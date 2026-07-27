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

/** True the first time (questId, period) is claimed this session; marks it seen. */
export function claimQuestReward(questId: string, period: string): boolean {
  const key = `${questId}:${period}`;
  if (firedQuestKeys.has(key)) return false;
  firedQuestKeys.add(key);
  return true;
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
  period: string
): QuestRewardToast[] {
  const out: QuestRewardToast[] = [];
  for (const q of quests) {
    if (q.justAwarded && claimQuestReward(q.id, period)) {
      out.push({ questId: q.id, name: q.name, xpReward: q.xpReward });
    }
  }
  return out;
}

// ── Surprise bonuses (sessionStorage-backed, seeded silently) ─────────────────

const SURPRISE_SEEN_KEY = "stbr:surprise-bonus-seen";
const SURPRISE_INIT_KEY = "stbr:surprise-bonus-init";

// In-memory fallback for SSR / non-DOM test env (sessionStorage absent).
const memSeen = new Set<string>();
let memInit = false;

function store(): Storage | null {
  try {
    return typeof window !== "undefined" && window.sessionStorage
      ? window.sessionStorage
      : null;
  } catch {
    return null;
  }
}

function readSeen(): Set<string> {
  const s = store();
  if (!s) return memSeen;
  try {
    const raw = s.getItem(SURPRISE_SEEN_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return memSeen;
  }
}

function writeSeen(seen: Set<string>): void {
  const s = store();
  if (!s) return;
  try {
    // Cap so the store can't grow without bound over a long session.
    s.setItem(SURPRISE_SEEN_KEY, JSON.stringify([...seen].slice(-200)));
  } catch {
    // Storage full / disabled — the in-memory set still dedupes this session.
  }
}

function hasInitialized(): boolean {
  const s = store();
  if (!s) return memInit;
  return s.getItem(SURPRISE_INIT_KEY) === "1";
}

function markInitialized(seen: Set<string>): void {
  const s = store();
  if (!s) {
    memInit = true;
    return;
  }
  writeSeen(seen);
  try {
    s.setItem(SURPRISE_INIT_KEY, "1");
  } catch {
    memInit = true;
  }
}

/** True the first time this surprise-bonus award key is claimed; marks it seen. */
export function claimSurpriseBonus(key: string): boolean {
  if (!key) return false;
  const seen = readSeen();
  if (seen.has(key)) return false;
  seen.add(key);
  writeSeen(seen);
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
  rows: readonly XpTransactionRow[]
): number[] {
  const bonuses = rows.filter(
    (r) =>
      r.reason != null &&
      isSurpriseBonusReason(r.reason) &&
      r.amount != null &&
      r.amount > 0
  );

  if (!hasInitialized()) {
    const seen = readSeen();
    for (const r of bonuses) seen.add(surpriseKey(r));
    markInitialized(seen);
    return [];
  }

  const out: number[] = [];
  for (const r of bonuses) {
    if (claimSurpriseBonus(surpriseKey(r))) out.push(r.amount as number);
  }
  return out;
}

/** Test-only: clear both the quest and surprise session dedupe state. */
export function __resetServerXpFeedbackForTests(): void {
  firedQuestKeys.clear();
  memSeen.clear();
  memInit = false;
  const s = store();
  if (s) {
    try {
      s.removeItem(SURPRISE_SEEN_KEY);
      s.removeItem(SURPRISE_INIT_KEY);
    } catch {
      // ignore
    }
  }
}
