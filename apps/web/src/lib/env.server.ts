import "server-only";
import { z } from "zod";
import { formatEnvError } from "./env";

/**
 * Server-only secrets. Never imported into client code (`server-only` enforces
 * this). Validated eagerly at boot via `instrumentation.ts`.
 */
const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // Server-only Solana RPC endpoint. This is the one that may carry a
  // privileged Helius API key — it is never inlined into the client bundle
  // (`server-only` enforces that). Required so a misconfigured deployment
  // fails loudly here instead of silently falling back to public devnet.
  SOLANA_RPC_URL: z.url(),
  // Optional: only needed for admin Sanity writes. Validated as non-empty when
  // present so a blank token surfaces here rather than as a silent
  // unauthenticated client at the Sanity API call.
  SANITY_ADMIN_TOKEN: z.string().min(1).optional(),
});

const parsed = serverEnvSchema.safeParse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL,
  SANITY_ADMIN_TOKEN: process.env.SANITY_ADMIN_TOKEN,
});

if (!parsed.success) {
  throw new Error(formatEnvError("server", parsed.error));
}

export const serverEnv = parsed.data;
