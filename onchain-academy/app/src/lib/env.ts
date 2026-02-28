/**
 * Environment variable exports.
 *
 * IMPORTANT: Next.js only inlines NEXT_PUBLIC_* env vars when accessed via
 * static string literals (e.g. process.env.NEXT_PUBLIC_FOO). Dynamic access
 * like process.env[name] resolves to undefined on the client. All public
 * vars therefore use direct property access below.
 */

// --- Public (exposed to client via static inlining) ---

export const NEXT_PUBLIC_SOLANA_NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK ??
  "devnet") as "mainnet-beta" | "devnet";

export const NEXT_PUBLIC_PROGRAM_ID =
  process.env.NEXT_PUBLIC_PROGRAM_ID ??
  "EHgTQKSeAAoh7JVMij46CFVzThh4xUi7RDjZjHnA7qR6";

export const NEXT_PUBLIC_XP_MINT_ADDRESS =
  process.env.NEXT_PUBLIC_XP_MINT_ADDRESS ?? "";

export const NEXT_PUBLIC_CREDENTIAL_COLLECTION =
  process.env.NEXT_PUBLIC_CREDENTIAL_COLLECTION ?? "";

export const NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

// --- Cloudflare Turnstile ---

export const NEXT_PUBLIC_TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

// --- Server-only ---

export const HELIUS_API_KEY = process.env.HELIUS_API_KEY ?? "";

export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID ?? "";
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET ?? "";

export const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY ?? "";

// --- Derived ---

export const HELIUS_RPC_URL = HELIUS_API_KEY
  ? `https://${NEXT_PUBLIC_SOLANA_NETWORK === "devnet" ? "devnet" : "mainnet"}.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : NEXT_PUBLIC_SOLANA_NETWORK === "devnet"
    ? "https://api.devnet.solana.com"
    : "https://api.mainnet-beta.solana.com";

export const SOLANA_EXPLORER_URL =
  NEXT_PUBLIC_SOLANA_NETWORK === "devnet"
    ? "https://explorer.solana.com/address/%s?cluster=devnet"
    : "https://explorer.solana.com/address/%s";
