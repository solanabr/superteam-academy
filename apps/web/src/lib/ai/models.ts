import type { PartnerAction } from "@/lib/ai/partner-types";

// Per-action Gemini model routing (#868, unified-spec item 3b / economics doc
// P1-1). Every Gemini caller in the app resolves its model HERE, so the routing
// table, the price sheet the spend ledger bills against, and the URL builder
// stay in one place and cannot drift apart.
//
// Model-history correction (supersedes the old route.ts folklore): the claim
// that the 2.5 family 404s "for new keys" is STALE. The 2026-07-28 reachability
// curls on the prod key (#838 comment, AIE-04) returned HTTP 200 on
// generateContent for `gemini-3.5-flash`, `gemini-3.5-flash-lite` AND
// `gemini-3.6-flash`, and 2.5-flash/-lite appear in this key's model list. The
// same record notes a first-connection artifact: the very first attempts
// produced spurious 404s with EMPTY bodies, and every retry returned a real 200
// — so any future "this model 404s for our key" claim must be re-tested twice
// before it is believed (or written down).
//
// AIE-05 from the same record: `thinkingConfig: { thinkingBudget: 0 }` is
// VERIFIED HONORED (no `thoughtsTokenCount` under budget-0; 146 thinking tokens
// on the no-config control). Callers keep sending it — thinking tokens bill at
// the OUTPUT rate, so it is a real cost lever, not a formality.

export const GEMINI_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
] as const;

export type GeminiModel = (typeof GEMINI_MODELS)[number];

export interface ModelRates {
  inputUsdPerMTok: number;
  outputUsdPerMTok: number;
}

/**
 * Gemini price sheet, USD per 1M tokens — economics doc §2.1 table (source:
 * https://ai.google.dev/gemini-api/docs/pricing). Thinking tokens bill at the
 * OUTPUT rate (#591). This is the ledger's billing truth: a model with no entry
 * here cannot be routed to, which is deliberate — routing to an unpriced model
 * would make the #591 spend ledger under-report the sponsor's burn.
 *
 * `gemini-3.5-flash` is no longer routed by default; it stays in the table as
 * the documented fallback pin (and because its rates are what the pre-#868
 * traffic actually cost).
 */
export const MODEL_RATES: Record<GeminiModel, ModelRates> = {
  "gemini-3.6-flash": { inputUsdPerMTok: 1.5, outputUsdPerMTok: 7.5 },
  "gemini-3.5-flash-lite": { inputUsdPerMTok: 0.3, outputUsdPerMTok: 2.5 },
  "gemini-3.5-flash": { inputUsdPerMTok: 1.5, outputUsdPerMTok: 9.0 },
};

/** The cheap tier: short, bounded, low-stakes generations. */
export const FLASH_LITE_MODEL: GeminiModel = "gemini-3.5-flash-lite";

/** The quality tier: multi-hundred-token reasoning-shaped generations. */
export const FLASH_MODEL: GeminiModel = "gemini-3.6-flash";

/**
 * Socratic-tier turns (#887 §4.4) are ONE diagnostic question at a hint-sized
 * output cap — the cheapest shape the tutor emits, and the highest-volume tier
 * (per-lesson ceiling 10 → 30 turns, 60 with the self-reset). Routing them to
 * flash-lite regardless of the base action mapping is the single biggest lever
 * in this change: ~$0.004/turn on the old pin → ~$0.0007.
 */
export const SOCRATIC_MODEL: GeminiModel = FLASH_LITE_MODEL;

/**
 * The openEnded reflection reply (lib/ai/reflection-reply.ts) is a single
 * unstructured note capped at 512 output tokens, best-effort, never blocking the
 * seal. Low stakes + bounded output = the cheap tier is the right fit per the
 * economics doc's classification; nothing about it needs 3.6-flash's headroom.
 */
export const REFLECTION_REPLY_MODEL: GeminiModel = FLASH_LITE_MODEL;

/**
 * Base action → model. `hint` is short and high-volume (flash-lite); `ask` and
 * `propose` carry the quality-sensitive reasoning and diff contracts
 * (3.6-flash, which dominates the old pin on output price and ties on input).
 * `review` is not in the economics doc's table — it emits a summary plus notes
 * over the learner's finished code, the same quality shape as `ask`, so it
 * follows `ask` rather than the cheap tier.
 */
const DEFAULT_ACTION_MODEL: Record<PartnerAction, GeminiModel> = {
  hint: FLASH_LITE_MODEL,
  ask: FLASH_MODEL,
  propose: FLASH_MODEL,
  review: FLASH_MODEL,
};

// Optional per-action env overrides, so a price move or a model deprecation can
// be answered from the dashboard without a deploy. Defaults live in code above;
// these are an escape hatch, not configuration. A value outside GEMINI_MODELS is
// IGNORED (warn + fall back to the coded default) — an unpriced model would
// silently break the ledger's accounting, so the allowlist is the price table.
const ACTION_MODEL_ENV: Record<PartnerAction, string> = {
  hint: "AI_MODEL_HINT",
  ask: "AI_MODEL_ASK",
  propose: "AI_MODEL_PROPOSE",
  review: "AI_MODEL_REVIEW",
};

const SOCRATIC_MODEL_ENV = "AI_MODEL_SOCRATIC";
const REFLECTION_MODEL_ENV = "AI_MODEL_REFLECTION";

export function isGeminiModel(value: string): value is GeminiModel {
  return (GEMINI_MODELS as readonly string[]).includes(value);
}

function envModel(name: string): GeminiModel | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;
  if (!isGeminiModel(raw)) {
    console.warn(
      `[ai/models] ignoring ${name}="${raw}" — not a priced model (${GEMINI_MODELS.join(", ")})`
    );
    return undefined;
  }
  return raw;
}

/**
 * Resolve the model for one AI Partner turn.
 *
 * The Socratic contract wins over the base mapping, but only where it APPLIES:
 * §4.2 keeps `propose`'s full diff contract at every ladder tier, and `review`
 * is post-pass and unaffected — so only `hint`/`ask` are re-routed when the turn
 * lands in the Socratic tier.
 */
export function modelForAction(
  action: PartnerAction,
  opts?: { socratic?: boolean }
): GeminiModel {
  if (opts?.socratic && (action === "hint" || action === "ask")) {
    return envModel(SOCRATIC_MODEL_ENV) ?? SOCRATIC_MODEL;
  }
  return envModel(ACTION_MODEL_ENV[action]) ?? DEFAULT_ACTION_MODEL[action];
}

/** Resolve the model for the openEnded reflection reply. */
export function modelForReflectionReply(): GeminiModel {
  return envModel(REFLECTION_MODEL_ENV) ?? REFLECTION_REPLY_MODEL;
}

/** The generateContent endpoint for a routed model. */
export function geminiUrl(model: GeminiModel): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}
