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

// An optional Solana keypair secret: a JSON array of 64 bytes, the format every
// on-chain key here uses. Validated at boot so a malformed value fails loudly
// instead of at the first transaction. The message never echoes the value.
const keypairSecretOpt = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z
    .string()
    .refine(isKeypairJson, "must be a JSON array of 64 bytes")
    .optional()
);

function isKeypairJson(value: string): boolean {
  try {
    const parsed: unknown = JSON.parse(value);
    return (
      Array.isArray(parsed) &&
      parsed.length === 64 &&
      parsed.every((b) => Number.isInteger(b) && b >= 0 && b <= 255)
    );
  } catch {
    return false;
  }
}

// An optional non-negative integer. Unset or blank leaves it `undefined`.
const nonNegativeIntOpt = z.preprocess(
  (v) => (v === "" || v === undefined ? undefined : v),
  z.coerce.number().int().min(0).optional()
);

// An optional positive SOL amount. Unset or blank leaves it `undefined`.
const solAmountOpt = z.preprocess(
  (v) => (v === "" || v === undefined ? undefined : v),
  z.coerce.number().gt(0).optional()
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
  // Sponsor wallet: pays the fee and rent for sponsored enrollments and the fee
  // (plus any rent the program lets us choose the payer for) on every other
  // server-sent transaction, so learner usage is paid from one place
  // (lib/solana/sponsor.ts). Unset on mainnet makes those sends fail closed;
  // on devnet the backend signer pays instead, with a logged warning.
  SPONSOR_SECRET: keypairSecretOpt,
  // Low-balance alert threshold in SOL for the sponsor and backend signer
  // wallets, checked by the on-chain queue cron. Unset disables the alert.
  SPONSOR_LOW_BALANCE_SOL: solAmountOpt,
  // Ceiling on the priority-fee price (micro-lamports per compute unit) of
  // every transaction the app sends or builds (lib/solana/priority-fee.ts).
  // Unset uses the code default; 0 stops paying priority fees.
  PRIORITY_FEE_MAX_MICROLAMPORTS: nonNegativeIntOpt,
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
  // Helius key for WEBHOOK MANAGEMENT only — the registration/list calls
  // against Helius's REST API, which live in the operator tool
  // scripts/helius-webhook-config.ts (run by hand; nothing in the app imports
  // it). The app itself only VERIFIES inbound webhook deliveries. No DAS API call exists
  // anywhere in this codebase; the old "+ DAS API" note here described an
  // integration that was never built. Server-only and UNRESTRICTED — never
  // NEXT_PUBLIC_, and not the same key as the domain-restricted one behind
  // NEXT_PUBLIC_SOLANA_RPC_URL.
  HELIUS_API_KEY: optStr,
  // Resend API key for marketing/announcement email (#769). Server-only.
  // Optional at boot — the email pipeline is FAIL-CLOSED: unset ⇒ send() returns
  // an 'unconfigured' result and NOTHING is sent (lib/email/resend.ts). Set it
  // once a Resend sending domain (DKIM/SPF/DMARC) is verified.
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
  // Shared password for the read-only teacher course preview (#828). Optional
  // at boot and FAIL-CLOSED: unset ⇒ /api/teach/preview/auth 503s and the
  // preview is disabled (lib/teach/preview-auth.ts). There is no default —
  // the old literal "123" fallback meant every deployment that forgot this var
  // shipped a guessable gate.
  TEACH_PREVIEW_PASSWORD: optStr,
  // Optional dedicated key for sealing the AI Partner's comprehension-check /
  // attestation tokens (lib/ai/check-seal.ts). Falls back to
  // SUPABASE_SERVICE_ROLE_KEY when unset.
  AI_PARTNER_SEAL_SECRET: optStr,

  // AI tutor spend caps (#591). Daily ceilings in US dollars, per
  // America/Sao_Paulo day, enforced by the ai_spend_ledger (lib/ai/spend-ledger).
  // Derive them from the funded AI spend, split into a daily envelope. Config,
  // not constants: change them when the funding changes; the ledger binds on
  // the envelope, not on any cost estimate. Over a *soft* cap the route
  // DEGRADES (shorter output budget); only a *hard* cap denies (503).
  // usdNum: whole/decimal dollars, "" → default. Must be non-negative.
  AI_SPEND_GLOBAL_SOFT_USD: usdNum(14), // most of the daily envelope
  AI_SPEND_GLOBAL_HARD_USD: usdNumHard(25), // above the envelope; absorbs a spike day
  AI_SPEND_ACCOUNT_SOFT_USD: usdNum(0.5), // well above an average learner's use
  AI_SPEND_ACCOUNT_HARD_USD: usdNumHard(1.5), // one account gets a small share of the envelope
  AI_SPEND_IP_SOFT_USD: usdNum(2), // survives a NAT'd classroom
  AI_SPEND_IP_HARD_USD: usdNumHard(5), // one IP can't take most of the envelope
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
  HELIUS_WEBHOOK_SECRET: process.env.HELIUS_WEBHOOK_SECRET,
  BACKEND_SIGNER_SECRET: process.env.BACKEND_SIGNER_SECRET,
  XP_MINT_AUTHORITY_SECRET: process.env.XP_MINT_AUTHORITY_SECRET,
  PROGRAM_AUTHORITY_SECRET: process.env.PROGRAM_AUTHORITY_SECRET,
  SPONSOR_SECRET: process.env.SPONSOR_SECRET,
  SPONSOR_LOW_BALANCE_SOL: process.env.SPONSOR_LOW_BALANCE_SOL,
  PRIORITY_FEE_MAX_MICROLAMPORTS: process.env.PRIORITY_FEE_MAX_MICROLAMPORTS,
  BUILD_SERVER_URL: process.env.BUILD_SERVER_URL,
  BUILD_SERVER_API_KEY: process.env.BUILD_SERVER_API_KEY,
  MODERATION_WEBHOOK_URL: process.env.MODERATION_WEBHOOK_URL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  ARWEAVE_UPLOADER_SECRET: process.env.ARWEAVE_UPLOADER_SECRET,
  HELIUS_API_KEY: process.env.HELIUS_API_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  CRON_SECRET: process.env.CRON_SECRET,
  EMAIL_FROM: process.env.EMAIL_FROM,
  TEACH_PREVIEW_PASSWORD: process.env.TEACH_PREVIEW_PASSWORD,
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
