/**
 * Environment variable validation and typed exports.
 * Required vars throw in production; optional vars log warnings.
 */

const isProduction = process.env.NODE_ENV === "production";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    if (isProduction) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    console.warn(`[env] Missing required variable: ${name}`);
    return "";
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

// --- Public (exposed to client) ---

export const NEXT_PUBLIC_SOLANA_NETWORK = optional(
  "NEXT_PUBLIC_SOLANA_NETWORK",
  "devnet",
) as "mainnet-beta" | "devnet";

export const NEXT_PUBLIC_PROGRAM_ID = optional(
  "NEXT_PUBLIC_PROGRAM_ID",
  "EHgTQKSeAAoh7JVMij46CFVzThh4xUi7RDjZjHnA7qR6",
);

export const NEXT_PUBLIC_XP_MINT_ADDRESS = optional(
  "NEXT_PUBLIC_XP_MINT_ADDRESS",
  "",
);

export const NEXT_PUBLIC_CREDENTIAL_COLLECTION = optional(
  "NEXT_PUBLIC_CREDENTIAL_COLLECTION",
  "",
);

export const NEXT_PUBLIC_SUPABASE_URL = optional(
  "NEXT_PUBLIC_SUPABASE_URL",
  "",
);

// --- Server-only ---

export const HELIUS_API_KEY = optional("HELIUS_API_KEY", "");

export const SUPABASE_SERVICE_ROLE_KEY = optional(
  "SUPABASE_SERVICE_ROLE_KEY",
  "",
);

export const GOOGLE_CLIENT_ID = optional("GOOGLE_CLIENT_ID", "");
export const GOOGLE_CLIENT_SECRET = optional("GOOGLE_CLIENT_SECRET", "");
export const GITHUB_CLIENT_ID = optional("GITHUB_CLIENT_ID", "");
export const GITHUB_CLIENT_SECRET = optional("GITHUB_CLIENT_SECRET", "");

// --- Cloudflare Turnstile ---

export const NEXT_PUBLIC_TURNSTILE_SITE_KEY = optional(
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "",
);

export const TURNSTILE_SECRET_KEY = optional("TURNSTILE_SECRET_KEY", "");

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
