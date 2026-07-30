import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";
import {
  FREE_ASSIST_TURNS,
  METERED_ASSIST_TURNS,
  SOCRATIC_ASSIST_TURNS,
  MAX_PAID_ASSISTS,
} from "./partner-types";
import type {
  AssistResetState,
  AssistTier,
  AssistTurnCounts,
  PartnerMessage,
} from "./partner-types";

// Single source of truth lives in partner-types.ts (shared client/server).
// Re-exported here so existing consumers (the route, tests) keep importing it
// from `@/lib/ai/assist-budget`.
export { MAX_PAID_ASSISTS };

/** Exhausted counts, used by every fail-CLOSED deny path below. */
const EXHAUSTED_COUNTS: AssistTurnCounts = {
  free: FREE_ASSIST_TURNS,
  metered: METERED_ASSIST_TURNS,
  socratic: SOCRATIC_ASSIST_TURNS,
};

export interface SpendTurnResult {
  allowed: boolean;
  /** The tier this turn landed in ("exhausted" when denied). */
  tier: AssistTier;
  counts: AssistTurnCounts;
}

const SPENDABLE_TIERS: readonly AssistTier[] = ["free", "metered", "socratic"];

function isSpendableTier(value: unknown): value is AssistTier {
  return (
    typeof value === "string" &&
    (SPENDABLE_TIERS as readonly string[]).includes(value)
  );
}

/**
 * Atomically spend one assist-ladder turn (#864). Tier resolution — free →
 * metered → Socratic → exhausted — happens INSIDE the SECURITY DEFINER RPC,
 * so two concurrent requests cannot both land in a tier's last slot. Fails
 * CLOSED: any RPC error, malformed row, or throw denies as exhausted.
 */
export async function spendAssistTurn(
  userId: string,
  lessonId: string
): Promise<SpendTurnResult> {
  const denied: SpendTurnResult = {
    allowed: false,
    tier: "exhausted",
    counts: EXHAUSTED_COUNTS,
  };
  try {
    const { data, error } = await createAdminClient().rpc(
      "spend_assist_ladder_turn",
      {
        p_user_id: userId,
        p_lesson_id: lessonId,
        p_free_max: FREE_ASSIST_TURNS,
        p_metered_max: METERED_ASSIST_TURNS,
        p_socratic_max: SOCRATIC_ASSIST_TURNS,
      }
    );
    const row = Array.isArray(data) ? data[0] : data;
    if (
      error ||
      !row ||
      typeof row.allowed !== "boolean" ||
      typeof row.free_turns !== "number" ||
      typeof row.metered_turns !== "number" ||
      typeof row.socratic_turns !== "number" ||
      (row.allowed && !isSpendableTier(row.tier))
    ) {
      console.warn(
        "[assist-budget] ladder spend failed, denying:",
        error?.message ?? JSON.stringify(data)
      );
      return denied;
    }
    return {
      allowed: row.allowed,
      tier: row.allowed ? (row.tier as AssistTier) : "exhausted",
      counts: {
        free: row.free_turns,
        metered: row.metered_turns,
        socratic: row.socratic_turns,
      },
    };
  } catch (err) {
    console.warn("[assist-budget] ladder spend threw, denying:", err);
    return denied;
  }
}

export interface ResetAssistsResult {
  allowed: boolean;
  /** 'reset' | 'already_used' | 'cooldown' | 'nothing_to_reset' (RPC contract). */
  reason: string;
  /** When reason === 'cooldown': epoch-ms the reset becomes available. */
  availableAt: number | null;
}

/**
 * Guarded self-serve per-lesson reset (P2-5, owner D-8). The once-per-(user,
 * lesson) flag AND the 7-day cooldown are enforced INSIDE the SECURITY
 * DEFINER `reset_challenge_assists` RPC (rule R-6) — this wrapper only relays
 * the verdict. Fails CLOSED (deny) on any error.
 */
export async function resetAssists(
  userId: string,
  lessonId: string
): Promise<ResetAssistsResult> {
  const denied: ResetAssistsResult = {
    allowed: false,
    reason: "error",
    availableAt: null,
  };
  try {
    const { data, error } = await createAdminClient().rpc(
      "reset_challenge_assists",
      {
        p_user_id: userId,
        p_lesson_id: lessonId,
      }
    );
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row || typeof row.allowed !== "boolean") {
      console.warn(
        "[assist-budget] reset failed, denying:",
        error?.message ?? JSON.stringify(data)
      );
      return denied;
    }
    const availableAt =
      typeof row.available_at === "string"
        ? new Date(row.available_at).getTime()
        : null;
    return {
      allowed: row.allowed,
      reason: typeof row.reason === "string" ? row.reason : "error",
      availableAt: Number.isFinite(availableAt) ? availableAt : null,
    };
  } catch (err) {
    console.warn("[assist-budget] reset threw, denying:", err);
    return denied;
  }
}

/**
 * Tier-aware decrement-by-one refund for a ladder turn that was spent but
 * never delivered (the Gemini call failed/timed out before billing). Hands
 * back exactly the tier the spend landed in — NOT the whole-lesson reset.
 * Best-effort: a failed refund just means the user keeps the charge, not a
 * fail-closed concern, so this never throws.
 */
export async function refundAssistTurn(
  userId: string,
  lessonId: string,
  tier: AssistTier
): Promise<void> {
  if (tier === "exhausted") return; // nothing was spent
  try {
    const { error } = await createAdminClient().rpc(
      "refund_assist_ladder_turn",
      {
        p_user_id: userId,
        p_lesson_id: lessonId,
        p_tier: tier,
      }
    );
    if (error) {
      console.warn("[assist-budget] refund failed:", error.message);
    }
  } catch (err) {
    console.warn("[assist-budget] refund threw:", err);
  }
}

/**
 * Increment the NON-REFUNDABLE billed-assist counter for a (user, lesson): one
 * bump per confirmed Gemini 200, regardless of whether the output was usable
 * (empty / non-JSON / MAX_TOKENS-truncated all still cost us). Unlike the tier
 * counters — which the `!response.ok` refund path can hand back — this is
 * the durable record of real spend against the platform-funded key, so it is
 * never decremented. Best-effort: an audit-counter write must not break the
 * paid reply the learner is owed, so this never throws.
 */
export async function recordBilledAssist(
  userId: string,
  lessonId: string
): Promise<void> {
  try {
    const { error } = await createAdminClient().rpc("record_billed_assist", {
      p_user_id: userId,
      p_lesson_id: lessonId,
    });
    if (error) {
      console.warn("[assist-budget] record billed failed:", error.message);
    }
  } catch (err) {
    console.warn("[assist-budget] record billed threw:", err);
  }
}

/**
 * Append rendered chat turns to the learner's per-lesson AI Partner log so a
 * returning learner can review past notes without spending another assist.
 * Called ONLY on a successful paid response (after every refund path has
 * returned), keeping the log aligned with the assists actually charged.
 * Best-effort: never throws, so a logging failure can't break the response the
 * learner already paid for.
 */
export async function appendAssistLog(
  userId: string,
  lessonId: string,
  entries: PartnerMessage[]
): Promise<void> {
  if (entries.length === 0) return;
  try {
    const { error } = await createAdminClient().rpc(
      "append_challenge_assist_log",
      {
        p_user_id: userId,
        p_lesson_id: lessonId,
        // PartnerMessage[] is structurally JSON but not assignable to the
        // recursive Json type without a cast (named interfaces lack an index
        // signature). Safe: every field is a string/array/object literal.
        p_entries: entries as unknown as Json,
      }
    );
    if (error) {
      console.warn("[assist-budget] append log failed:", error.message);
    }
  } catch (err) {
    console.warn("[assist-budget] append log threw:", err);
  }
}

export interface AssistState {
  counts: AssistTurnCounts;
  resetState: AssistResetState;
  /** epoch-ms the reset becomes available (null when used or no row). */
  resetAvailableAt: number | null;
  log: PartnerMessage[];
}

const RESET_STATES: readonly AssistResetState[] = [
  "available",
  "cooldown",
  "used",
  "none",
];

/**
 * Read a learner's per-lesson ladder counts + reset availability + persisted
 * chat log for pane rehydration on load. Fails soft to an empty state so a
 * missing row / read error just shows an empty chat (never blocks the lesson).
 */
export async function getAssistState(
  userId: string,
  lessonId: string
): Promise<AssistState> {
  const empty: AssistState = {
    counts: { free: 0, metered: 0, socratic: 0 },
    resetState: "none",
    resetAvailableAt: null,
    log: [],
  };
  try {
    const { data, error } = await createAdminClient().rpc(
      "get_challenge_assist_state",
      { p_user_id: userId, p_lesson_id: lessonId }
    );
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row) return empty;
    const resetState =
      typeof row.reset_state === "string" &&
      (RESET_STATES as readonly string[]).includes(row.reset_state)
        ? (row.reset_state as AssistResetState)
        : "none";
    const availableAt =
      typeof row.reset_available_at === "string"
        ? new Date(row.reset_available_at).getTime()
        : null;
    return {
      counts: {
        free: typeof row.free_turns === "number" ? row.free_turns : 0,
        metered: typeof row.metered_turns === "number" ? row.metered_turns : 0,
        socratic:
          typeof row.socratic_turns === "number" ? row.socratic_turns : 0,
      },
      resetState,
      resetAvailableAt: Number.isFinite(availableAt) ? availableAt : null,
      log: Array.isArray(row.chat_log)
        ? (row.chat_log as PartnerMessage[])
        : [],
    };
  } catch {
    return empty;
  }
}
