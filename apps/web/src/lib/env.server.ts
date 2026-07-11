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
  SOLANA_RPC_URL: z.url(),
  // Optional: only needed for admin Sanity writes.
  SANITY_ADMIN_TOKEN: optStr,
  // Fine-grained READ token for solanabr/courses-academy. Server-only. Needed by
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
});

const parsed = serverEnvSchema.safeParse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL,
  SANITY_ADMIN_TOKEN: process.env.SANITY_ADMIN_TOKEN,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  ADMIN_SECRET: process.env.ADMIN_SECRET,
  HELIUS_WEBHOOK_SECRET: process.env.HELIUS_WEBHOOK_SECRET,
  BACKEND_SIGNER_SECRET: process.env.BACKEND_SIGNER_SECRET,
  XP_MINT_AUTHORITY_SECRET: process.env.XP_MINT_AUTHORITY_SECRET,
  PROGRAM_AUTHORITY_SECRET: process.env.PROGRAM_AUTHORITY_SECRET,
  BUILD_SERVER_URL: process.env.BUILD_SERVER_URL,
  BUILD_SERVER_API_KEY: process.env.BUILD_SERVER_API_KEY,
  MODERATION_WEBHOOK_URL: process.env.MODERATION_WEBHOOK_URL,
});

if (!parsed.success) {
  throw new Error(formatEnvError("server", parsed.error));
}

export const serverEnv = parsed.data;
