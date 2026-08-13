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
  // Public browser RPC endpoint — inlined into the client bundle, so the key it
  // carries (if any) is visible in the Network tab. Two ways to populate it
  // safely: a keyless rate-limited public endpoint (e.g. api.devnet.solana.com),
  // or a Helius key that is DOMAIN-RESTRICTED in the Helius dashboard (Allowed
  // Origins = the app's domains only) so a copied key can't be abused off-domain.
  // This key MUST be a *separate* key from the server's SOLANA_RPC_URL: that one
  // is unrestricted, and server calls send no browser Origin — sharing one key
  // and origin-restricting it would break every server-side RPC/DAS read.
  NEXT_PUBLIC_SOLANA_RPC_URL: z.url(),
  // The app's own absolute origin. REQUIRED — not cosmetic: several server
  // paths interpolate it into strings that get PINNED ON-CHAIN or mailed out
  // (certificate `external_url` + metadata URI in api/certificates/mint,
  // lib/solana/onchain-queue, lib/helius/event-handlers, api/admin/courses/sync
  // and api/admin/achievements/sync). Those sites keep a `?? ""` fallback as
  // defense in depth, but with an unset var that fallback mints a RELATIVE URI
  // ("/api/certificates/metadata?id=…") into an immutable Metaplex Core asset —
  // unfixable after the fact. Validating here makes that state unreachable:
  // boot/build fails loudly instead.
  //
  // Dev/test default to http://localhost:3000 (the documented local origin, see
  // .env.example) so `pnpm dev` and the suites need no extra setup; in
  // production the value must be supplied explicitly — no default can be right
  // there, and a silently-wrong origin is exactly the failure we are closing.
  NEXT_PUBLIC_APP_URL: z.preprocess(
    (value) =>
      value === "" || value === undefined
        ? process.env.NODE_ENV === "production"
          ? undefined
          : "http://localhost:3000"
        : value,
    z.url({
      error: "must be an absolute URL, e.g. https://academy.example.com",
    })
  ),
  // Optional Sentry DSN (public/safe to expose). Unset disables Sentry.
  NEXT_PUBLIC_SENTRY_DSN: z.url().optional().or(z.literal("")),
});

const parsed = publicEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SOLANA_RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
});

if (!parsed.success) {
  throw new Error(formatEnvError("public", parsed.error));
}

export const env = parsed.data;
