import "server-only";
import { z } from "zod";
import { formatEnvError } from "./env";

/**
 * Server-only secrets. Never imported into client code (`server-only` enforces
 * this). Validated eagerly at boot via `instrumentation.ts`.
 *
 * Required vars must be non-empty or the app refuses to start. Optional vars
 * are validated for format/non-emptiness when present so a set-but-blank value
 * surfaces here rather than as a silent failure deep in a route handler.
 */
const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // Server-only Solana RPC endpoint. This is the one that may carry a
  // privileged Helius API key — it is never inlined into the client bundle
  // (`server-only` enforces that). Required so a misconfigured deployment
  // fails loudly here instead of silently falling back to public devnet.
  SOLANA_RPC_URL: z.url(),
  // Optional: only needed for admin Sanity writes.
  SANITY_ADMIN_TOKEN: z.string().min(1).optional(),
  // Admin panel HMAC cookie signing key.
  ADMIN_SECRET: z.string().min(1).optional(),
  // Helius webhook HMAC verification secret.
  HELIUS_WEBHOOK_SECRET: z.string().min(1).optional(),
  // On-chain keypairs (JSON array of 64 bytes).
  XP_MINT_AUTHORITY_SECRET: z.string().min(1).optional(),
  PROGRAM_AUTHORITY_SECRET: z.string().min(1).optional(),
  // Anchor build-server proxy.
  BUILD_SERVER_URL: z.url().optional(),
  BUILD_SERVER_API_KEY: z.string().min(1).optional(),
});

const parsed = serverEnvSchema.safeParse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL,
  SANITY_ADMIN_TOKEN: process.env.SANITY_ADMIN_TOKEN,
  ADMIN_SECRET: process.env.ADMIN_SECRET,
  HELIUS_WEBHOOK_SECRET: process.env.HELIUS_WEBHOOK_SECRET,
  XP_MINT_AUTHORITY_SECRET: process.env.XP_MINT_AUTHORITY_SECRET,
  PROGRAM_AUTHORITY_SECRET: process.env.PROGRAM_AUTHORITY_SECRET,
  BUILD_SERVER_URL: process.env.BUILD_SERVER_URL,
  BUILD_SERVER_API_KEY: process.env.BUILD_SERVER_API_KEY,
});

if (!parsed.success) {
  throw new Error(formatEnvError("server", parsed.error));
}

export const serverEnv = parsed.data;
