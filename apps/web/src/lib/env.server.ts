import "server-only";
import { z } from "zod";
import { formatEnvError } from "./env";

// z.optional() only skips validation for `undefined`, not "". A set-but-blank
// env var passes the type check but fails min(1). Preprocess "" → undefined so
// blank Vercel placeholder values are treated as unset rather than invalid.
const optStr = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().min(1).optional()
);
const optUrl = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.url().optional()
);

// A non-negative USD amount from an env var, with a default. Treats "" (blank
// Vercel placeholder) and unset as the default, and coerces the string value to
// a number. Rejects a set-to-garbage or negative value so a fat-fingered cap
// fails loudly at boot rather than silently disabling the ledger.
const usdNum = (fallback: number) =>
  z.preprocess(
    (v) => (v === "" || v === undefined ? fallback : v),
    z.coerce.number().min(0)
  );

// An OPTIONAL non-negative USD amount: unset or blank leaves it `undefined` so
// the caller can fall back to a code-side default (the per-model price sheet),
// while a set-to-garbage or negative value still fails loudly at boot.
const usdNumOpt = z.preprocess(
  (v) => (v === "" || v === undefined ? undefined : v),
  z.coerce.number().min(0).optional()
);

// A HARD-cap dollar amount. Identical to usdNum but rejects 0: a hard cap of $0
// denies every request (self-DoS). Fail-closed makes that "safe" but silent —
// so reject it loudly at boot instead of letting a fat-fingered `=0` take the
// tutor offline (#724 minor). Soft caps may legitimately be 0 (always degrade),
// so only the hard caps use this stricter guard.
const usdNumHard = (fallback: number) =>
  z.preprocess(
    (v) => (v === "" || v === undefined ? fallback : v),
    z.coerce
      .number()
      .gt(
        0,
        "AI spend HARD cap must be greater than 0 (a $0 hard cap denies every request)"
      )
  );

/**
 * Server-only secrets. Never imported into client code (`server-only` enforces
 * this). Validated eagerly at boot via `instrumentation.ts`.
 *
 * Required vars must be non-empty or the app refuses to start. Optional vars
 * use optStr/optUrl which treat "" as unset so blank placeholders don't crash
 * boot — only a set-to-garbage value does.
 */
const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // Server-only Solana RPC endpoint. This is the one that may carry a
  // privileged Helius API key — it is never inlined into the client bundle
  // (`server-only` enforces that). Required so a misconfigured deployment
  // fails loudly here instead of silently falling back to public devnet.
  // Use a SEPARATE, UNRESTRICTED Helius key here — distinct from the domain-
  // restricted key behind NEXT_PUBLIC_SOLANA_RPC_URL. Server requests carry no
  // browser Origin, so an origin-restricted key would 4xx on every call.
  SOLANA_RPC_URL: z.url(),
  // Fine-grained READ token for solanabr/academy-courses. Server-only. Needed by
  // the drift UI (HEAD polling) and the Checks API (blocked state). Optional at
  // boot; the content routes 503 when unset. Unauthenticated GitHub is 60 req/hr
  // per IP and flakes on Vercel.
  GITHUB_TOKEN: optStr,
  // Admin panel HMAC cookie signing key.
  ADMIN_SECRET: optStr,
  // Helius webhook HMAC verification secret.
  HELIUS_WEBHOOK_SECRET: optStr,
  // On-chain keypairs (JSON array of 64 bytes).
  // BACKEND_SIGNER_SECRET is the rotatable backend signer stored in the Config
  // PDA. Required for all server-side on-chain instructions (completeLesson,
  // finalizeCourse, issueCredential, awardAchievement, rewardXp). On devnet
  // this is typically the same keypair as PROGRAM_AUTHORITY_SECRET.
  BACKEND_SIGNER_SECRET: optStr,
  XP_MINT_AUTHORITY_SECRET: optStr,
  PROGRAM_AUTHORITY_SECRET: optStr,
  // Anchor build-server proxy.
  BUILD_SERVER_URL: optUrl,
  BUILD_SERVER_API_KEY: optStr,
  // Optional: Slack/Discord-compatible incoming webhook. When set, the first
  // flag on a community post pings it so admins know to check the moderation
  // queue. Unset → no notification (the queue is still available in /admin).
  MODERATION_WEBHOOK_URL: optUrl,
  // Gemini key for /api/ai/* (omit to disable the AI lesson assistant).
  GEMINI_API_KEY: optStr,
  // Funds Irys uploads that pin credential metadata to Arweave at mint
  // (lib/solana/arweave.ts). Unset → mint falls back to the app-served
  // metadata URL.
  ARWEAVE_UPLOADER_SECRET: optStr,
  // Helius key for WEBHOOK MANAGEMENT only (lib/helius/webhook-config) — the
  // registration/list calls against Helius's REST API. No DAS API call exists
  // anywhere in this codebase; the old "+ DAS API" note here described an
  // integration that was never built. Server-only and UNRESTRICTED — never
  // NEXT_PUBLIC_, and not the same key as the domain-restricted one behind
  // NEXT_PUBLIC_SOLANA_RPC_URL.
  HELIUS_API_KEY: optStr,
  // Resend API key for marketing/announcement email (#769). Server-only.
  // Optional at boot — the email pipeline is FAIL-CLOSED: unset ⇒ send() returns
  // an 'unconfigured' result and NOTHING is sent (lib/email/resend.ts). The
  // owner sets this once a Resend sending domain (DKIM/SPF/DMARC) is verified.
  RESEND_API_KEY: optStr,
  // Shared secret for Vercel Cron (#869). Vercel sends it as
  // `Authorization: Bearer $CRON_SECRET` on every scheduled invocation. Optional
  // at boot, but /api/cron/* FAILS CLOSED without it (503, nothing sent) — an
  // unset secret must never leave a mail trigger open to the internet.
  CRON_SECRET: optStr,
  // The verified From identity for marketing mail, e.g.
  // "Superteam Academy <news@st.academy>". Optional — falls back to
  // DEFAULT_EMAIL_FROM (lib/email/resend.ts) when unset.
  EMAIL_FROM: optStr,
  // Optional dedicated key for sealing the AI Partner's comprehension-check /
  // attestation tokens (lib/ai/check-seal.ts). Falls back to
  // SUPABASE_SERVICE_ROLE_KEY when unset.
  AI_PARTNER_SEAL_SECRET: optStr,

  // AI tutor spend caps (#591). Daily ceilings in whole US dollars, per
  // America/Sao_Paulo day, enforced by the ai_spend_ledger (lib/ai/spend-ledger).
  // Derived DOWNWARD from the $500/mo sponsor commitment (O-1): a $16.67/day
  // envelope. Config, not constants — bump these when the commitment moves; the
  // ledger binds on the envelope, not on any cost estimate. Over a *soft* cap the
  // route DEGRADES (shorter output budget); only a *hard* cap denies (503).
  // usdNum: whole/decimal dollars, "" → default. Must be non-negative.
  AI_SPEND_GLOBAL_SOFT_USD: usdNum(14), // ~84% of the daily envelope
  AI_SPEND_GLOBAL_HARD_USD: usdNumHard(25), // 1.5× envelope; absorbs a spike day
  AI_SPEND_ACCOUNT_SOFT_USD: usdNum(0.5), // ~17× the $0.03/learner/mo average
  AI_SPEND_ACCOUNT_HARD_USD: usdNumHard(1.5), // a single account ≤ ~9% of the envelope
  AI_SPEND_IP_SOFT_USD: usdNum(2), // survives a NAT'd classroom
  AI_SPEND_IP_HARD_USD: usdNumHard(5), // caps a single-IP farm at ~30% of the envelope
  // Gemini price sheet OVERRIDE (USD per 1M tokens). Since #868 the ledger
  // prices each billed call at its ROUTED model's rates (MODEL_RATES in
  // lib/ai/models) — a single global rate pair would misprice every action that
  // isn't the pinned model. These two stay as an emergency, all-models override
  // for a provider price move that can't wait for a deploy; UNSET by default so
  // the per-model sheet is what bills. Thinking tokens bill at the OUTPUT rate.
  AI_SPEND_INPUT_USD_PER_MTOK: usdNumOpt,
  AI_SPEND_OUTPUT_USD_PER_MTOK: usdNumOpt,
});

const parsed = serverEnvSchema.safeParse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  ADMIN_SECRET: process.env.ADMIN_SECRET,
  HELIUS_WEBHOOK_SECRET: process.env.HELIUS_WEBHOOK_SECRET,
  BACKEND_SIGNER_SECRET: process.env.BACKEND_SIGNER_SECRET,
  XP_MINT_AUTHORITY_SECRET: process.env.XP_MINT_AUTHORITY_SECRET,
  PROGRAM_AUTHORITY_SECRET: process.env.PROGRAM_AUTHORITY_SECRET,
  BUILD_SERVER_URL: process.env.BUILD_SERVER_URL,
  BUILD_SERVER_API_KEY: process.env.BUILD_SERVER_API_KEY,
  MODERATION_WEBHOOK_URL: process.env.MODERATION_WEBHOOK_URL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  ARWEAVE_UPLOADER_SECRET: process.env.ARWEAVE_UPLOADER_SECRET,
  HELIUS_API_KEY: process.env.HELIUS_API_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  CRON_SECRET: process.env.CRON_SECRET,
  EMAIL_FROM: process.env.EMAIL_FROM,
  AI_PARTNER_SEAL_SECRET: process.env.AI_PARTNER_SEAL_SECRET,
  AI_SPEND_GLOBAL_SOFT_USD: process.env.AI_SPEND_GLOBAL_SOFT_USD,
  AI_SPEND_GLOBAL_HARD_USD: process.env.AI_SPEND_GLOBAL_HARD_USD,
  AI_SPEND_ACCOUNT_SOFT_USD: process.env.AI_SPEND_ACCOUNT_SOFT_USD,
  AI_SPEND_ACCOUNT_HARD_USD: process.env.AI_SPEND_ACCOUNT_HARD_USD,
  AI_SPEND_IP_SOFT_USD: process.env.AI_SPEND_IP_SOFT_USD,
  AI_SPEND_IP_HARD_USD: process.env.AI_SPEND_IP_HARD_USD,
  AI_SPEND_INPUT_USD_PER_MTOK: process.env.AI_SPEND_INPUT_USD_PER_MTOK,
  AI_SPEND_OUTPUT_USD_PER_MTOK: process.env.AI_SPEND_OUTPUT_USD_PER_MTOK,
});

if (!parsed.success) {
  throw new Error(formatEnvError("server", parsed.error));
}

export const serverEnv = parsed.data;
