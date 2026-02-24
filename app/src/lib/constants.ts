export const SOLANA_NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK ??
  "devnet") as "mainnet-beta" | "devnet";

const HELIUS_KEY = process.env.HELIUS_API_KEY ?? "";

/** Server-side RPC URL (includes API key). Use only in server components / API routes. */
export const HELIUS_RPC_URL = HELIUS_KEY
  ? `https://${SOLANA_NETWORK === "devnet" ? "devnet" : "mainnet"}.helius-rpc.com/?api-key=${HELIUS_KEY}`
  : SOLANA_NETWORK === "devnet"
    ? "https://api.devnet.solana.com"
    : "https://api.mainnet-beta.solana.com";

export const XP_MINT_ADDRESS = process.env.NEXT_PUBLIC_XP_MINT_ADDRESS ?? "";
export const PROGRAM_ID =
  process.env.NEXT_PUBLIC_PROGRAM_ID ||
  "EHgTQKSeAAoh7JVMij46CFVzThh4xUi7RDjZjHnA7qR6";
export const CREDENTIAL_COLLECTION =
  process.env.NEXT_PUBLIC_CREDENTIAL_COLLECTION ?? "";
export const SOLANA_EXPLORER_URL =
  SOLANA_NETWORK === "devnet"
    ? "https://explorer.solana.com/address/%s?cluster=devnet"
    : "https://explorer.solana.com/address/%s";
export const APP_NAME = "Superteam Academy";

export const DIFFICULTY_LEVELS = [
  "beginner",
  "intermediate",
  "advanced",
] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

export const TRACK_TYPES = [
  "rust",
  "anchor",
  "frontend",
  "security",
  "defi",
  "mobile",
] as const;
export type TrackType = (typeof TRACK_TYPES)[number];

export const TRACK_LABELS: Record<TrackType, string> = {
  rust: "Rust",
  anchor: "Anchor",
  frontend: "Frontend",
  security: "Security",
  defi: "DeFi",
  mobile: "Mobile",
};

export const TRACK_COLORS: Record<TrackType, string> = {
  rust: "#F48252",
  anchor: "#CA9FF5",
  frontend: "#6693F7",
  security: "#EF4444",
  defi: "#55E9AB",
  mobile: "#EC4899",
};

export const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  beginner: "#55E9AB",
  intermediate: "#FFC526",
  advanced: "#EF4444",
};

export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

export function xpForLevel(level: number): number {
  return level * level * 100;
}

export function xpToNextLevel(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp);
  return xpForLevel(currentLevel + 1) - currentXp;
}

export function levelProgress(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp);
  const currentLevelXp = xpForLevel(currentLevel);
  const nextLevelXp = xpForLevel(currentLevel + 1);
  const range = nextLevelXp - currentLevelXp;
  if (range === 0) return 100;
  return Math.min(((currentXp - currentLevelXp) / range) * 100, 100);
}
