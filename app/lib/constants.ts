import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ||
    "ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf"
);

export const TOKEN_2022_PROGRAM_ID = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);

export const MPL_CORE_PROGRAM_ID = new PublicKey(
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
);

export const XP_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_XP_MINT ||
    "XPuMBHoJ8X8iBuMmBPfkKoVPXm8b2rqeNLd9wBiRdxv"
);

export const HELIUS_RPC =
  process.env.NEXT_PUBLIC_HELIUS_RPC ||
  "https://devnet.helius-rpc.com/?api-key=demo";

export const CLUSTER =
  (process.env.NEXT_PUBLIC_CLUSTER as "devnet" | "mainnet-beta") || "devnet";

// XP & Level calculations
export const XP_PER_LESSON = 100;
export const LEVEL_FROM_XP = (xp: number) => Math.floor(Math.sqrt(xp / 100));
export const XP_FOR_NEXT_LEVEL = (level: number) => (level + 1) * (level + 1) * 100;
export const XP_PROGRESS_PERCENT = (xp: number) => {
  const level = LEVEL_FROM_XP(xp);
  const currentLevelXp = level * level * 100;
  const nextLevelXp = XP_FOR_NEXT_LEVEL(level);
  return ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
};

// Difficulty labels
export const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Beginner",
  2: "Intermediate", 
  3: "Advanced",
};

export const DIFFICULTY_COLORS: Record<number, string> = {
  1: "text-green-400",
  2: "text-yellow-400",
  3: "text-red-400",
};

// Track names
export const TRACK_NAMES: Record<number, string> = {
  1: "Solana Fundamentals",
  2: "Anchor Development",
  3: "DeFi Development",
  4: "NFT Development",
  5: "Security & Auditing",
};