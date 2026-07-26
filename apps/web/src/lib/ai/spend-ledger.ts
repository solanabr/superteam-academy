import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env.server";

// AI tutor spend ledger (#591). The AI Partner spends a Superteam-sponsored
// Gemini key; `challenge_assists` counts turns, not cost. This module gates and
// records the ACTUAL micro-USD spend against per-account, per-IP, and global
// daily ceilings (America/Sao_Paulo days), enforced by the ai_spend_ledger
// RPCs. It fails CLOSED: any check error denies (503), never waves traffic
// through unmetered on the platform-funded key — the assist-budget contract
// (#590), the opposite of check_rate_limit's fail-open.

const MICRO_PER_USD = 1_000_000;

/**
 * The route's spend decision for a single request, chosen BEFORE the model call
 * from today's accumulated spend:
 *   - "full"     — under every soft cap; serve at the normal output budget.
 *   - "degraded" — at/over a soft cap; serve with a shorter output budget.
 *   - "denied"   — at/over a hard cap, OR the ledger was unreachable (fail
 *                  closed). The route 503s; no assist is spent.
 */
export type SpendDecision = "full" | "degraded" | "denied";

export type SpendDenyReason = "spend_cap" | "ledger_unavailable";

export interface SpendGate {
  decision: SpendDecision;
  reason?: SpendDenyReason;
}

interface SpendCapsMicroUsd {
  accountSoft: number;
  accountHard: number;
  ipSoft: number;
  ipHard: number;
  globalSoft: number;
  globalHard: number;
}

interface SpendRates {
  inputUsdPerMTok: number;
  outputUsdPerMTok: number;
}

// The Gemini token accounting we bill against. Thinking tokens
// (`thoughtsTokenCount`) bill at the OUTPUT rate (#591), so they are summed with
// candidate tokens. All fields are optional — a response missing usageMetadata
// records a zero-cost request (still counted) rather than throwing.
export interface GeminiUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  thoughtsTokenCount?: number;
}

function capsMicroUsd(): SpendCapsMicroUsd {
  return {
    accountSoft: Math.round(
      serverEnv.AI_SPEND_ACCOUNT_SOFT_USD * MICRO_PER_USD
    ),
    accountHard: Math.round(
      serverEnv.AI_SPEND_ACCOUNT_HARD_USD * MICRO_PER_USD
    ),
    ipSoft: Math.round(serverEnv.AI_SPEND_IP_SOFT_USD * MICRO_PER_USD),
    ipHard: Math.round(serverEnv.AI_SPEND_IP_HARD_USD * MICRO_PER_USD),
    globalSoft: Math.round(serverEnv.AI_SPEND_GLOBAL_SOFT_USD * MICRO_PER_USD),
    globalHard: Math.round(serverEnv.AI_SPEND_GLOBAL_HARD_USD * MICRO_PER_USD),
  };
}

function rates(): SpendRates {
  return {
    inputUsdPerMTok: serverEnv.AI_SPEND_INPUT_USD_PER_MTOK,
    outputUsdPerMTok: serverEnv.AI_SPEND_OUTPUT_USD_PER_MTOK,
  };
}

function nonNegInt(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : 0;
}

/**
 * Micro-USD cost of one billed generation from its usageMetadata. Pure and
 * env-free (rates are injected) so it is unit-testable. Since cost_usd =
 * tokens/1e6 × usdPerMTok, micro_usd (= cost_usd × 1e6) = tokens × usdPerMTok.
 * Thinking tokens are billed at the output rate.
 */
export function estimateSpendMicroUsd(
  usage: GeminiUsageMetadata | undefined,
  r: SpendRates
): number {
  if (!usage) return 0;
  const prompt = nonNegInt(usage.promptTokenCount);
  const output = nonNegInt(usage.candidatesTokenCount);
  const thinking = nonNegInt(usage.thoughtsTokenCount);
  const inputMicro = prompt * r.inputUsdPerMTok;
  const outputMicro = (output + thinking) * r.outputUsdPerMTok;
  return Math.max(0, Math.round(inputMicro + outputMicro));
}

/**
 * The degraded output-token budget: half the normal budget, floored so the
 * reply stays usable. Degrade is a SHORTER OUTPUT (the dominant cost lever), not
 * a model swap — gemini's cheaper flash-lite tier is gated for new keys (the
 * route documents the 404), so shrinking the output budget is the real,
 * always-available degrade.
 */
export function degradedMaxTokens(base: number): number {
  return Math.max(256, Math.floor(base / 2));
}

/**
 * Read today's accumulated spend across all three dimensions and pick a tier.
 * FAIL CLOSED: an RPC error, a missing row, or a non-numeric total all deny with
 * `ledger_unavailable` — the ledger going dark must never wave unmetered traffic
 * through onto the sponsor's card.
 */
export async function checkAiSpend(
  userId: string,
  ip: string
): Promise<SpendGate> {
  const caps = capsMicroUsd();
  try {
    const { data, error } = await createAdminClient().rpc("check_ai_spend", {
      p_user_id: userId,
      p_ip: ip,
    });
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row) {
      console.warn(
        "[spend-ledger] check failed, denying:",
        error?.message ?? JSON.stringify(data)
      );
      return { decision: "denied", reason: "ledger_unavailable" };
    }
    // BIGINT can arrive as a string from PostgREST; coerce and re-validate.
    const account = Number(row.account_micro_usd);
    const perIp = Number(row.ip_micro_usd);
    const global = Number(row.global_micro_usd);
    if (![account, perIp, global].every(Number.isFinite)) {
      console.warn("[spend-ledger] non-numeric totals, denying:", row);
      return { decision: "denied", reason: "ledger_unavailable" };
    }

    if (
      account >= caps.accountHard ||
      perIp >= caps.ipHard ||
      global >= caps.globalHard
    ) {
      return { decision: "denied", reason: "spend_cap" };
    }
    if (
      account >= caps.accountSoft ||
      perIp >= caps.ipSoft ||
      global >= caps.globalSoft
    ) {
      return { decision: "degraded" };
    }
    return { decision: "full" };
  } catch (err) {
    console.warn("[spend-ledger] check threw, denying:", err);
    return { decision: "denied", reason: "ledger_unavailable" };
  }
}

/**
 * Record the actual micro-USD cost of a billed generation into all three daily
 * buckets. Best-effort: called only after Gemini has billed us, on the paid
 * path, and must never break the reply the learner is owed, so it never throws.
 * A recording failure loses one data point of audit, not correctness — the CAP
 * is enforced by `checkAiSpend`, which fails closed on its own.
 *
 * `fallback` books a CONSERVATIVE estimate when `usage` is absent or measures
 * zero — a billed call whose 200 body was non-JSON, or that carried no
 * usageMetadata, still cost tokens, and booking $0 would silently under-report
 * true key burn (#724). Pass the caller's own worst-case shape (its full output
 * budget + a generous input estimate); it is used ONLY when the metered estimate
 * is zero, so a normal metered call is unaffected.
 */
export async function recordAiSpend(
  userId: string,
  ip: string,
  usage: GeminiUsageMetadata | undefined,
  fallback?: { promptTokens: number; outputTokens: number }
): Promise<void> {
  const r = rates();
  let microUsd = estimateSpendMicroUsd(usage, r);
  if (microUsd <= 0 && fallback) {
    microUsd = estimateSpendMicroUsd(
      {
        promptTokenCount: fallback.promptTokens,
        candidatesTokenCount: fallback.outputTokens,
      },
      r
    );
  }
  try {
    const { error } = await createAdminClient().rpc("record_ai_spend", {
      p_user_id: userId,
      p_ip: ip,
      p_micro_usd: microUsd,
    });
    if (error) {
      console.warn("[spend-ledger] record failed:", error.message);
    }
  } catch (err) {
    console.warn("[spend-ledger] record threw:", err);
  }
}

/**
 * Admin observability: today's global spend (micro-USD) and request count, so
 * the sponsor's burn is visible before the invoice. Fails soft to zeros so a
 * read error shows an empty-but-present figure, never a crash.
 */
export async function getAiSpendToday(): Promise<{
  microUsd: number;
  requestCount: number;
}> {
  try {
    const { data, error } = await createAdminClient().rpc("get_ai_spend_today");
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row) return { microUsd: 0, requestCount: 0 };
    const microUsd = Number(row.micro_usd);
    const requestCount = Number(row.request_count);
    return {
      microUsd: Number.isFinite(microUsd) ? microUsd : 0,
      requestCount: Number.isFinite(requestCount) ? requestCount : 0,
    };
  } catch {
    return { microUsd: 0, requestCount: 0 };
  }
}
