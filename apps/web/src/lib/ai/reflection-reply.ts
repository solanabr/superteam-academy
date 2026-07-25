import "server-only";
import { isRateLimited } from "@/lib/rate-limit";
import { serverEnv } from "@/lib/env.server";

// Best-effort AI feedback for an `openEnded` reflection. NEVER blocks the seal:
// the attestation route computes and returns the receipt independently, then
// calls this for enrichment only. Any failure, rate-limit, disabled flag, or
// unset key resolves to `null` and the seal is issued regardless (spec §3 item
// 6 — "degrade never block", AIE-21).
//
// Default OFF. The reply is a metered cost path, and AI spend accounting is
// owned by #590 — until it lands, the reply ships behind OPENENDED_AI_REPLY so
// launch runs seal-only at zero AI cost. This helper deliberately does NOT touch
// the assist-budget ledger (spendAssist/refundAssist): the reflection reply is
// not a code-challenge assist and must not draw from that budget.

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";

// A short feedback note, not an essay. Kept small so an enabled reply is cheap
// and low-latency; gemini-3.5-flash is a thinking model, so thinking is disabled
// to spend the whole budget on the visible response.
const MAX_OUTPUT_TOKENS = 512;

// Hard ceiling on the model call. The reflect route delivers the seal in the
// SAME response, after this resolves — so a hung upstream must not stall the
// receipt until the platform kills the function. On timeout the call aborts and
// the reply degrades to null; the seal ships regardless.
const REPLY_TIMEOUT_MS = 10_000;

interface ReflectionReplyInput {
  userId: string;
  prompt: string;
  reflection: string;
}

/**
 * Returns a brief AI note on the learner's reflection, or `null` when the reply
 * is disabled, the key is unset, the caller is over the reply rate limit, or the
 * model call fails in any way. Never throws.
 */
export async function maybeGenerateReflectionReply({
  userId,
  prompt,
  reflection,
}: ReflectionReplyInput): Promise<string | null> {
  if (process.env.OPENENDED_AI_REPLY !== "1") return null;

  const apiKey = serverEnv.GEMINI_API_KEY;
  if (!apiKey) return null;

  // Bound the reply independently of the route's seal limiter, so enabling the
  // flag cannot uncork unbounded model spend. Fails open like every limiter —
  // but the try/catch below still contains any resulting call failure to `null`.
  try {
    if (
      await isRateLimited("ai:reflection", userId, {
        maxTokens: 10,
        refillIntervalMs: 60_000,
      })
    ) {
      return null;
    }
  } catch {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REPLY_TIMEOUT_MS);
  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
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
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
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
