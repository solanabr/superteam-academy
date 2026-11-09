import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env.server";
import { MODEL_RATES } from "@/lib/ai/models";
import type { GeminiModel, ModelRates } from "@/lib/ai/models";

// AI tutor spend ledger (#591). The AI Partner spends a Superteam-sponsored
// Gemini key; `challenge_assists` counts turns, not cost. This module books the
// micro-USD spend against per-account, per-IP and global daily ceilings
// (America/Sao_Paulo days), plus a shared pool for low-trust accounts, through
// the ai_spend_ledger RPCs.
//
// Each billed call is reserve → model call → settle. `reserveAiSpend` holds the
// call's worst-case cost against every hard cap in one SQL transaction before
// the model runs; `settleAiSpend` replaces the hold with the actual cost after;
// `releaseAiSpend` returns the hold of a call that was never billed. Reserving
// fails CLOSED: any ledger error denies (503), the assist-budget contract
// (#590), the opposite of check_rate_limit's fail-open.

const MICRO_PER_USD = 1_000_000;

/**
 * The ledger's decision for one request, made by reserve_ai_spend:
 *   - "full"     — under every soft cap and the full-budget worst case fits;
 *                  serve at the normal output budget.
 *   - "degraded" — over a soft cap, or only the shorter budget's worst case
 *                  fits; serve with the shorter output budget.
 *   - "denied"   — neither fits under the hard caps, OR the ledger was
 *                  unreachable (fail closed). Nothing is held.
 */
export type SpendDecision = "full" | "degraded" | "denied";

export type SpendDenyReason = "spend_cap" | "ledger_unavailable";

/**
 * A hold booked by `reserveAiSpend`. Pass it back unchanged to
 * `settleAiSpend` or `releaseAiSpend`: the settle applies to the same buckets
 * (including the newcomer pool when `lowTrust`) on the same `spendDay`.
 */
export interface SpendReservation {
  userId: string;
  ip: string;
  /** America/Sao_Paulo day the hold was booked on, `YYYY-MM-DD`. */
  spendDay: string;
  /** Decided in SQL: no completed lesson, or a profile under 24 hours old. */
  lowTrust: boolean;
  reservedMicroUsd: number;
}

export type SpendGate =
  | { decision: "full" | "degraded"; reservation: SpendReservation }
  | { decision: "denied"; reason: SpendDenyReason };

interface SpendCapsMicroUsd {
  accountSoft: number;
  accountHard: number;
  ipSoft: number;
  ipHard: number;
  globalSoft: number;
  globalHard: number;
  newcomerSoft: number;
  newcomerHard: number;
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
    newcomerSoft: Math.round(
      serverEnv.AI_SPEND_NEWCOMER_SOFT_USD * MICRO_PER_USD
    ),
    newcomerHard: Math.round(
      serverEnv.AI_SPEND_NEWCOMER_HARD_USD * MICRO_PER_USD
    ),
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
 * The most one generation can cost: the whole prompt at the uncached input rate
 * and the whole output budget at the output rate (thinking tokens draw from the
 * same budget). What `reserveAiSpend` holds before the call.
 */
export function worstCaseMicroUsd(
  model: GeminiModel,
  promptTokens: number,
  outputTokens: number
): number {
  return estimateSpendMicroUsd(
    { promptTokenCount: promptTokens, candidatesTokenCount: outputTokens },
    ratesFor(model)
  );
}

/**
 * An upper bound on the input tokens a request body can be billed for: its
 * UTF-8 byte length. Every token covers at least one byte of the text it
 * encodes, and the serialized body also carries the response schema and
 * config, which only adds to the count.
 */
export function inputTokenBound(body: string): number {
  return Buffer.byteLength(body, "utf8");
}

const DECISIONS: ReadonlySet<string> = new Set(["full", "degraded", "denied"]);

/**
 * Hold this request's worst-case cost before the model call. The caller passes
 * the worst case at the full and at the degraded output budget; the SQL picks
 * the tier, checks it fits under every hard cap (and the newcomer pool for a
 * low-trust account) and books it, all in one transaction.
 *
 * FAIL CLOSED: an RPC error, a missing row or a malformed row all deny with
 * `ledger_unavailable` — the ledger going dark must never wave unmetered
 * traffic through onto the sponsor's card.
 */
export async function reserveAiSpend(
  userId: string,
  ip: string,
  amounts: { fullMicroUsd: number; degradedMicroUsd: number }
): Promise<SpendGate> {
  const caps = capsMicroUsd();
  const unavailable: SpendGate = {
    decision: "denied",
    reason: "ledger_unavailable",
  };
  try {
    const { data, error } = await createAdminClient().rpc("reserve_ai_spend", {
      p_user_id: userId,
      p_ip: ip,
      p_full_micro_usd: amounts.fullMicroUsd,
      p_degraded_micro_usd: amounts.degradedMicroUsd,
      p_account_soft: caps.accountSoft,
      p_account_hard: caps.accountHard,
      p_ip_soft: caps.ipSoft,
      p_ip_hard: caps.ipHard,
      p_global_soft: caps.globalSoft,
      p_global_hard: caps.globalHard,
      p_newcomer_soft: caps.newcomerSoft,
      p_newcomer_hard: caps.newcomerHard,
    });
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row) {
      console.warn(
        "[spend-ledger] reserve failed, denying:",
        error?.message ?? JSON.stringify(data)
      );
      return unavailable;
    }
    // BIGINT can arrive as a string from PostgREST; coerce and re-validate.
    const reserved = Number(row.reserved_micro_usd);
    if (
      typeof row.decision !== "string" ||
      !DECISIONS.has(row.decision) ||
      !Number.isFinite(reserved) ||
      reserved < 0 ||
      typeof row.reserved_day !== "string" ||
      typeof row.low_trust !== "boolean"
    ) {
      console.warn("[spend-ledger] malformed reserve row, denying:", row);
      return unavailable;
    }
    if (row.decision === "denied") {
      return { decision: "denied", reason: "spend_cap" };
    }
    return {
      decision: row.decision as "full" | "degraded",
      reservation: {
        userId,
        ip,
        spendDay: row.reserved_day,
        lowTrust: row.low_trust,
        reservedMicroUsd: reserved,
      },
    };
  } catch (err) {
    console.warn("[spend-ledger] reserve threw, denying:", err);
    return unavailable;
  }
}

async function settle(
  reservation: SpendReservation,
  actualMicroUsd: number,
  billed: boolean
): Promise<void> {
  try {
    const { error } = await createAdminClient().rpc("settle_ai_spend", {
      p_user_id: reservation.userId,
      p_ip: reservation.ip,
      p_spend_day: reservation.spendDay,
      p_low_trust: reservation.lowTrust,
      p_reserved_micro_usd: reservation.reservedMicroUsd,
      p_actual_micro_usd: actualMicroUsd,
      p_billed: billed,
    });
    if (error) {
      console.warn("[spend-ledger] settle failed:", error.message);
    }
  } catch (err) {
    console.warn("[spend-ledger] settle threw:", err);
  }
}

/**
 * Replace a hold with the actual micro-USD cost of the billed generation,
 * priced at the ROUTED MODEL's rates (#868) — the caller passes the model it
 * actually called. Never throws: it runs after Gemini has billed us and must
 * not break the reply the learner is owed. If it fails, the hold stays booked
 * at its worst case, which over-counts rather than under-counts.
 *
 * `fallback` books a CONSERVATIVE estimate when `usage` is absent or measures
 * zero — a billed call whose 200 body was non-JSON, or that carried no
 * usageMetadata, still cost tokens, and booking $0 would under-report true key
 * burn (#724). Pass the caller's own worst-case shape (its full output budget +
 * a generous input estimate); it is used ONLY when the metered estimate is
 * zero, so a normal metered call is unaffected.
 */
export async function settleAiSpend(
  reservation: SpendReservation,
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
  await settle(reservation, microUsd, true);
}

/**
 * Return the whole hold of a call Gemini never billed (a non-2xx, a throw
 * before the response, or a request that stopped before the model call). Counts
 * no request. Never throws; if it fails, the hold stays booked.
 */
export async function releaseAiSpend(
  reservation: SpendReservation
): Promise<void> {
  await settle(reservation, 0, false);
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
