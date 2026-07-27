import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * Surprise XP delight bonuses (LX-B15, pedagogy roadmap #8b).
 *
 * Unexpected rewards are the only reward form that does NOT undermine intrinsic
 * motivation (unified spec §2.1 / PED-10, d≈0.01). To keep that property the
 * bonus must be genuinely unpredictable: the trigger lives ONLY on the
 * server-side award path (the Helius `LessonCompleted` handler), rolls a
 * server-side RNG, is never pre-announced in any UI, follows no schedule a
 * learner could learn, and is capped per user per week. It rides the existing
 * `award_xp` rails unchanged — no schema change, no new SECURITY DEFINER
 * function; the weekly cap is enforced by counting prior bonus rows already in
 * `xp_transactions`.
 */

/** Probability that a completed lesson earns a surprise bonus. Server-only. */
export const SURPRISE_BONUS_PROBABILITY = 0.08;

/** Candidate bonus amounts (small, well under award_xp's 2000 per-award cap). */
export const SURPRISE_BONUS_AMOUNTS = [10, 15, 20, 25, 30, 35, 40] as const;

/** Most surprise bonuses a single user can receive in one ISO week. */
export const SURPRISE_BONUS_WEEKLY_CAP = 3;

/** Reason prefix — machine-readable, produced ONLY by the server award path. */
export const SURPRISE_BONUS_REASON_PREFIX = "surprise_bonus:";

/**
 * Roll for a surprise bonus. Returns the XP amount when the roll lands, else
 * `null`. `rng` is injectable so the roll is deterministic under test; in
 * production it is `Math.random`, evaluated server-side where no client can
 * observe or probe it.
 */
export function rollSurpriseBonusXp(
  rng: () => number = Math.random
): number | null {
  if (rng() >= SURPRISE_BONUS_PROBABILITY) return null;
  const index = Math.min(
    SURPRISE_BONUS_AMOUNTS.length - 1,
    Math.floor(rng() * SURPRISE_BONUS_AMOUNTS.length)
  );
  return SURPRISE_BONUS_AMOUNTS[index] ?? SURPRISE_BONUS_AMOUNTS[0];
}

/** Start (Monday 00:00 UTC) of the ISO week containing `now`. */
export function startOfIsoWeekUtc(now: Date): Date {
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const daysSinceMonday = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  return d;
}

export function surpriseBonusReason(lessonId: string): string {
  return `${SURPRISE_BONUS_REASON_PREFIX}${lessonId}`;
}

export function isSurpriseBonusReason(reason: string): boolean {
  return reason.startsWith(SURPRISE_BONUS_REASON_PREFIX);
}

interface SurpriseBonusInput {
  userId: string;
  lessonId: string;
  txSignature: string;
  /** Injectable RNG for tests; production uses `Math.random`. */
  rng?: () => number;
}

/**
 * Server-side surprise-bonus award. Rolls, enforces the weekly cap by counting
 * this week's existing bonus rows, and awards via `award_xp` when eligible.
 * Returns the awarded amount, or `null` when no bonus was granted.
 *
 * Fail-safe: if the cap cannot be verified (count query error) NO bonus is
 * granted — the function never over-grants. Idempotency is keyed on the
 * lesson-completion signature so a webhook retry can never double-award.
 * Throws only if the award itself fails, so the caller can log it as a
 * non-fatal side effect.
 */
export async function maybeAwardSurpriseBonus(
  supabase: SupabaseClient<Database>,
  { userId, lessonId, txSignature, rng = Math.random }: SurpriseBonusInput
): Promise<number | null> {
  const amount = rollSurpriseBonusXp(rng);
  if (amount === null) return null;

  const weekStart = startOfIsoWeekUtc(new Date());
  const { count, error: countError } = await supabase
    .from("xp_transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .like("reason", `${SURPRISE_BONUS_REASON_PREFIX}%`)
    .gte("created_at", weekStart.toISOString());

  if (countError) return null;
  if ((count ?? 0) >= SURPRISE_BONUS_WEEKLY_CAP) return null;

  const { error } = await supabase.rpc("award_xp", {
    p_user_id: userId,
    p_amount: amount,
    p_reason: surpriseBonusReason(lessonId),
    p_idempotency_key: `${txSignature}:SurpriseBonus`,
    p_tx_signature: txSignature,
    // #736: a surprise bonus is a platform grant, not learning XP — pin the
    // source (its 'surprise_bonus:' reason already derived to 'platform', but
    // state it positively so it can never drift).
    p_source: "platform",
  });

  if (error) throw new Error(error.message);
  return amount;
}
