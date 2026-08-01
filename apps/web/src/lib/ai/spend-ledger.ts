import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env.server";
import { MODEL_RATES } from "@/lib/ai/models";
import type { GeminiModel, ModelRates } from "@/lib/ai/models";

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

// Pricing is PER MODEL (#868): the route bills different models per action, so
// one global rate pair would misprice every call that isn't the pinned model.
// `ModelRates` is the shared shape; `MODEL_RATES` (lib/ai/models) is the sheet.
export type SpendRates = ModelRates;

// The Gemini token accounting we bill against. Thinking tokens
// (`thoughtsTokenCount`) bill at the OUTPUT rate (#591), so they are summed with
// candidate tokens. All fields are optional — a response missing usageMetadata
// records a zero-cost request (still counted) rather than throwing.
export interface GeminiUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  thoughtsTokenCount?: number;
  /**
   * Prompt tokens served from context cache. CRITICAL shape detail (verified
   * against the Gemini API docs 2026-07-31): this is a SUBSET of
   * `promptTokenCount`, not an addition to it — the cached tokens are already
   * counted there. Billing therefore splits the prompt into
   * (prompt − cached) at the input rate + cached at the cached-input rate;
   * adding them would double-count, and ignoring the field bills cache hits at
   * up to 10× their real price.
   */
  cachedContentTokenCount?: number;
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

/**
 * The rates one billed generation is priced at. Base is the per-model price
 * sheet (economics doc §2.1). `AI_SPEND_{INPUT,OUTPUT}_USD_PER_MTOK` remain as
 * an EMERGENCY override applied across all models — a provider price move can
 * be answered from the dashboard before a deploy — but they are now unset by
 * default, so the ledger prices each model correctly out of the box instead of
 * billing every call at one model's rates. There is deliberately NO cached-input
 * override: the cached rate always comes from the sheet, so an emergency input
 * override cannot accidentally reprice cache hits.
 */
export function ratesFor(model: GeminiModel): SpendRates {
  const base = MODEL_RATES[model];
  return {
    inputUsdPerMTok:
      serverEnv.AI_SPEND_INPUT_USD_PER_MTOK ?? base.inputUsdPerMTok,
    outputUsdPerMTok:
      serverEnv.AI_SPEND_OUTPUT_USD_PER_MTOK ?? base.outputUsdPerMTok,
    cachedInputUsdPerMTok: base.cachedInputUsdPerMTok,
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
 *
 * Prompt tokens are SPLIT: `cachedContentTokenCount` is a subset of
 * `promptTokenCount`, so the uncached remainder bills at the input rate and the
 * cached part at the (much cheaper) cached-input rate.
 */
export function estimateSpendMicroUsd(
  usage: GeminiUsageMetadata | undefined,
  r: SpendRates
): number {
  if (!usage) return 0;
  const prompt = nonNegInt(usage.promptTokenCount);
  const output = nonNegInt(usage.candidatesTokenCount);
  const thinking = nonNegInt(usage.thoughtsTokenCount);
  let cached = nonNegInt(usage.cachedContentTokenCount);
  if (cached > prompt) {
    // Malformed: cached tokens are by definition a subset of the prompt. Rather
    // than trust the discount on a shape we don't understand, discard it and
    // bill the whole prompt at the full input rate — the conservative direction
    // for a platform-funded key.
    console.warn(
      `[spend-ledger] cachedContentTokenCount ${cached} > promptTokenCount ${prompt} — malformed usage; billing the whole prompt at the input rate`
    );
    cached = 0;
  }
  const inputMicro =
    (prompt - cached) * r.inputUsdPerMTok + cached * r.cachedInputUsdPerMTok;
  const outputMicro = (output + thinking) * r.outputUsdPerMTok;
  return Math.max(0, Math.round(inputMicro + outputMicro));
}

/**
 * The degraded output-token budget: half the normal budget, floored so the
 * reply stays usable. Degrade remains a SHORTER OUTPUT, not a model swap —
 * per-action routing (#868) already spends each action on its cheapest adequate
 * model, so there is no cheaper tier left to fall to at degrade time without
 * changing what the action can do. (The old note here claimed flash-lite was
 * gated for new keys; the 2026-07-28 curl record disproved that — flash-lite is
 * now the *default* for hint and Socratic turns.)
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
 * buckets, priced at the ROUTED MODEL's rates (#868) — the caller passes the
 * model it actually called, so a flash-lite Socratic turn is not billed at
 * 3.6-flash prices (or vice versa). Best-effort: called only after Gemini has billed us, on the paid
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
  model: GeminiModel,
  usage: GeminiUsageMetadata | undefined,
  fallback?: { promptTokens: number; outputTokens: number }
): Promise<void> {
  const r = ratesFor(model);
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
