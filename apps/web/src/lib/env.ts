import { z } from "zod";

/**
 * Validated environment access.
 *
 * This module covers the **public** (`NEXT_PUBLIC_*`) variables that are inlined
 * into the client bundle at build time. Server-only secrets are validated in
 * `env.server.ts`. Both are eagerly checked at boot via `instrumentation.ts` so a
 * missing or malformed variable produces a clear, named error instead of a deep
 * SDK crash (e.g. the `Invalid supabaseUrl` trap).
 *
 * NOTE: each `NEXT_PUBLIC_*` value must be referenced with a static
 * `process.env.NEXT_PUBLIC_X` access below — Next.js only inlines literal
 * references into the client bundle, not dynamic `process.env[key]` lookups.
 */

/** Formats a ZodError into a readable, per-variable boot error. */
export function formatEnvError(scope: string, error: z.ZodError): string {
  const details = error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
  return [
    `Invalid ${scope} environment variables:`,
    details,
    "",
    "Check your environment configuration (see .env.example).",
  ].join("\n");
}

const publicEnvSchema = z.object({
  // Require https in production; allow http (e.g. localhost) in dev/test.
  NEXT_PUBLIC_SUPABASE_URL: z
    .url()
    .refine(
      (value) =>
        process.env.NODE_ENV !== "production" || value.startsWith("https://"),
      { error: "must use https:// in production" }
    ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1),
  // Preprocess "" to undefined so a set-but-blank var takes the default
  // instead of failing min(1) (z.default only activates on undefined, not "").
  NEXT_PUBLIC_SANITY_DATASET: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().min(1).default("production")
  ),
  // Public, rate-limited browser RPC endpoint. MUST NOT carry a privileged
  // Helius API key — it is inlined into the client bundle. The Helius-keyed
  // endpoint lives server-side as SOLANA_RPC_URL in env.server.ts.
  NEXT_PUBLIC_SOLANA_RPC_URL: z.url(),
  // Optional Sentry DSN (public/safe to expose). Unset disables Sentry.
  NEXT_PUBLIC_SENTRY_DSN: z.url().optional().or(z.literal("")),
});

const parsed = publicEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
  NEXT_PUBLIC_SOLANA_RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
});

if (!parsed.success) {
  throw new Error(formatEnvError("public", parsed.error));
}

export const env = parsed.data;
