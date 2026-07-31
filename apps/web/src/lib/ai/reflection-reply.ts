import "server-only";
import { isRateLimited } from "@/lib/rate-limit";
import { serverEnv } from "@/lib/env.server";
import {
  checkAiSpend,
  recordAiSpend,
  degradedMaxTokens,
} from "@/lib/ai/spend-ledger";
import type { GeminiUsageMetadata } from "@/lib/ai/spend-ledger";
import {
  modelForReflectionReply,
  geminiUrl,
  MINIMAL_THINKING_CONFIG,
} from "@/lib/ai/models";

// Best-effort AI feedback for an `openEnded` reflection. NEVER blocks the seal:
// the attestation route computes and returns the receipt independently, then
// calls this for enrichment only. Any failure, rate-limit, disabled flag, unset
// key, or spend-cap denial resolves to `null` and the seal is issued regardless
// (spec §3 item 6 — "degrade never block", AIE-21).
//
// Default ON since #848 (opt out with OPENENDED_AI_REPLY=0): the reply is
// fail-safe by design — ledger-gated, rate-limited, never blocks the seal —
// and a dark default meant the comprehension-reflection feedback loop never
// fired in prod. Still requires GEMINI_API_KEY; unset key keeps it dark.
// When live, this reply spends the
// SAME sponsored GEMINI_API_KEY as the AI Partner, so — per #724 — it now runs
// UNDER the #591 spend ledger: the same fail-closed checkAiSpend gate and
// recordAiSpend booking (account + IP + global caps), and a fail-CLOSED reply
// limiter. A denied reply is skipped, not 503'd — the seal still ships. This
// helper deliberately does NOT touch the assist-budget ledger
// (spendAssist/refundAssist): the reflection reply is not a code-challenge
// assist and must not draw from that per-lesson quota.

// Model: routed, not pinned (#868). This reply is the textbook cheap-tier case
// — ONE unstructured note, hard-capped at 512 output tokens, best-effort, and
// discarded entirely on any failure because the seal ships regardless. Nothing
// here needs 3.6-flash's headroom, and the #724 constraints in the header
// (capped, low-latency, ledger-gated) point the same way, so it routes to
// gemini-3.5-flash-lite (economics doc §2.1: $0.30/$2.50 per M vs $1.50/$9.00
// on the old pin — ~5× cheaper on output for the same 512-token ceiling).

// A short feedback note, not an essay. Kept small so an enabled reply is cheap
// and low-latency; the routed model is a thinking model, so thinking is disabled
// to spend the whole budget on the visible response.
const MAX_OUTPUT_TOKENS = 512;

// Conservative input-token estimate for the spend-ledger fallback (#724) when a
// billed 200 carries no usageMetadata. The prompt is the block prompt + the
// learner reflection (≤10k chars, ~2.5k tokens); round up so an unmeasurable
// billed call reads as more spend, not less. Used only when the metered estimate
// is zero.
const SPEND_FALLBACK_PROMPT_TOKENS = 3_000;

// The Gemini generateContent envelope, narrowed to the fields this helper reads.
// Typed (not `any`) so the defensive parse below stays type-safe.
interface ReflectionEnvelope {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  usageMetadata?: GeminiUsageMetadata;
}

// Hard ceiling on the model call. The reflect route delivers the seal in the
// SAME response, after this resolves — so a hung upstream must not stall the
// receipt until the platform kills the function. On timeout the call aborts and
// the reply degrades to null; the seal ships regardless.
const REPLY_TIMEOUT_MS = 10_000;

interface ReflectionReplyInput {
  userId: string;
  // The request's client IP, for the per-IP spend dimension (#724). Free wallet
  // signup means per-user keys alone cannot bound a Sybil actor.
  ip: string;
  prompt: string;
  reflection: string;
}

/**
 * Returns a brief AI note on the learner's reflection, or `null` when the reply
 * is disabled, the key is unset, the caller is over the reply rate limit, the
 * daily spend cap is hit, or the model call fails in any way. Never throws.
 */
export async function maybeGenerateReflectionReply({
  userId,
  ip,
  prompt,
  reflection,
}: ReflectionReplyInput): Promise<string | null> {
  // Default ON (#848); "0" is the explicit kill switch. Any other value —
  // unset, "1", garbage — leaves the reply enabled; GEMINI_API_KEY remains the
  // hard prerequisite below.
  if (process.env.OPENENDED_AI_REPLY === "0") return null;

  const apiKey = serverEnv.GEMINI_API_KEY;
  if (!apiKey) return null;

  // Bound the reply independently of the route's seal limiter, so enabling the
  // flag cannot uncork unbounded model spend. FAIL-CLOSED (#724): this spends the
  // sponsored key, so a limiter-store outage must skip the reply, not wave it
  // through unmetered. A skipped reply is free — the seal ships regardless.
  try {
    if (
      await isRateLimited("ai:reflection", userId, {
        maxTokens: 10,
        refillIntervalMs: 60_000,
        failClosed: true,
      })
    ) {
      return null;
    }
  } catch {
    return null;
  }

  // Daily SPEND gate (#724): this reply spends the same sponsored key as the AI
  // Partner, so it sits under the SAME #591 ledger — account + IP + global caps.
  // checkAiSpend fails closed on its own (a ledger outage returns "denied"), so a
  // denied decision — hard cap OR ledger down — SKIPS the reply and the seal
  // still ships (degrade never blocks, AIE-21). Over a soft cap, degrade to a
  // shorter reply rather than skipping.
  let outputTokens = MAX_OUTPUT_TOKENS;
  const gate = await checkAiSpend(userId, ip);
  if (gate.decision === "denied") return null;
  if (gate.decision === "degraded") {
    outputTokens = degradedMaxTokens(MAX_OUTPUT_TOKENS);
  }

  const model = modelForReflectionReply();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REPLY_TIMEOUT_MS);
  try {
    const response = await fetch(`${geminiUrl(model)}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text:
                  "You are a supportive Solana instructor giving brief, encouraging feedback " +
                  "on a learner's written reflection. Two or three sentences, no code. Do not grade.\n\n" +
                  `Prompt: ${prompt}\n\nLearner reflection: ${reflection}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: outputTokens,
          // 3.x floor — the 2.5-era `thinkingBudget: 0` 400s (see models.ts).
          thinkingConfig: MINIMAL_THINKING_CONFIG,
        },
      }),
    });

    if (!response.ok) return null;

    // Billed past here (2xx). Parse DEFENSIVELY so a non-JSON 200 can't throw
    // past the spend booking, then record the cost on the SAME ledger — with a
    // conservative fallback when usageMetadata is absent, so a billed reply is
    // never under-reported (#724). Best-effort: recordAiSpend never throws.
    let data: ReflectionEnvelope | undefined;
    try {
      data = (await response.json()) as ReflectionEnvelope;
    } catch {
      data = undefined;
    }
    await recordAiSpend(userId, ip, model, data?.usageMetadata, {
      promptTokens: SPEND_FALLBACK_PROMPT_TOKENS,
      outputTokens: MAX_OUTPUT_TOKENS,
    });
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === "string" && text.trim().length > 0
      ? text.trim()
      : null;
  } catch {
    // Includes the AbortError thrown when the timeout fires.
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
