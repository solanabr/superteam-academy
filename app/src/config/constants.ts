import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf"
);

export const XP_MINT = new PublicKey(
  "xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3"
);

export const TOKEN_2022_PROGRAM_ID = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);

export const MPL_CORE_PROGRAM_ID = new PublicKey(
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
);

export const SOLANA_NETWORK = "devnet" as const;
export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
export const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY || "";
export const HELIUS_RPC_URL = HELIUS_API_KEY
  ? `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : SOLANA_RPC_URL;

export const SUPPORTED_LOCALES = ["en", "pt-BR", "es"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = "en";

export const XP_PER_LEVEL_BASE = 100;
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / XP_PER_LEVEL_BASE));
}

export function xpForLevel(level: number): number {
  return level * level * XP_PER_LEVEL_BASE;
}

export function xpProgressInLevel(xp: number): number {
  const level = calculateLevel(xp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  return ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
}

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: "beginner",
  2: "intermediate",
  3: "advanced",
};

export const TRACK_LABELS: Record<number, string> = {
  1: "solana-fundamentals",
  2: "rust-development",
  3: "anchor-framework",
  4: "defi",
  5: "nft-development",
  6: "security",
};
