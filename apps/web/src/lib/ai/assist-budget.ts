import "server-only";
import { MAX_PAID_ASSISTS } from "./partner-types";
import type { PartnerMessage } from "./partner-types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";

// Single source of truth lives in partner-types.ts (shared client/server).
// Re-exported here so existing consumers (the route, tests) keep importing it
// from `@/lib/ai/assist-budget`.
export { MAX_PAID_ASSISTS };

export async function spendAssist(
  userId: string,
  lessonId: string
): Promise<{ allowed: boolean; used: number }> {
  try {
    const { data, error } = await createAdminClient().rpc(
      "spend_challenge_assist",
      {
        p_user_id: userId,
        p_lesson_id: lessonId,
        p_max_paid: MAX_PAID_ASSISTS,
      }
    );
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row || typeof row.allowed !== "boolean") {
      console.warn(
        "[assist-budget] spend failed, denying:",
        error?.message ?? JSON.stringify(data)
      );
      return { allowed: false, used: MAX_PAID_ASSISTS };
    }
    return { allowed: row.allowed, used: row.used };
  } catch (err) {
    console.warn("[assist-budget] spend threw, denying:", err);
    return { allowed: false, used: MAX_PAID_ASSISTS };
  }
}

export async function getAssistsUsed(
  userId: string,
  lessonId: string
): Promise<number> {
  try {
    const { data, error } = await createAdminClient().rpc(
      "get_challenge_assists",
      {
        p_user_id: userId,
        p_lesson_id: lessonId,
      }
    );
    if (error || typeof data !== "number") return MAX_PAID_ASSISTS;
    return data;
  } catch {
    return MAX_PAID_ASSISTS;
  }
}

export async function resetAssists(
  userId: string,
  lessonId: string
): Promise<void> {
  try {
    await createAdminClient().rpc("reset_challenge_assists", {
      p_user_id: userId,
      p_lesson_id: lessonId,
    });
  } catch (err) {
    console.warn("[assist-budget] reset failed:", err);
  }
}

/**
 * Decrement-by-one refund for a paid assist that was spent but never
 * delivered (the Gemini call failed/timed out/returned garbage after
 * `spendAssist` already charged the user). NOT `resetAssists` — that zeroes
 * the whole lesson and would over-refund every other legitimately-spent
 * assist. Best-effort: a failed refund just means the user keeps the charge,
 * not a fail-closed concern, so this never throws.
 */
export async function refundAssist(
  userId: string,
  lessonId: string
): Promise<void> {
  try {
    const { error } = await createAdminClient().rpc("refund_challenge_assist", {
      p_user_id: userId,
      p_lesson_id: lessonId,
    });
    if (error) {
      console.warn("[assist-budget] refund failed:", error.message);
    }
  } catch (err) {
    console.warn("[assist-budget] refund threw:", err);
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

/**
 * Read a learner's per-lesson paid-assist count + persisted chat log for pane
 * rehydration on load. Fails soft to an empty state so a missing row / read
 * error just shows an empty chat (never blocks the lesson).
 */
export async function getAssistState(
  userId: string,
  lessonId: string
): Promise<{ paidUsed: number; log: PartnerMessage[] }> {
  try {
    const { data, error } = await createAdminClient().rpc(
      "get_challenge_assist_state",
      { p_user_id: userId, p_lesson_id: lessonId }
    );
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row) return { paidUsed: 0, log: [] };
    return {
      paidUsed: typeof row.assists_used === "number" ? row.assists_used : 0,
      log: Array.isArray(row.chat_log)
        ? (row.chat_log as PartnerMessage[])
        : [],
    };
  } catch {
    return { paidUsed: 0, log: [] };
  }
}
