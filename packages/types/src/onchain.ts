// On-chain account types for the Superteam Academy Solana program.
// These map to the PDA accounts defined in the bounty spec's Anchor program.
// Currently used for type-safe deserialization of on-chain reads;
// write paths are stubbed and delegate to Supabase via API routes.

// --- PDA Seeds (for accounts we read) ---
export const PDA_SEEDS = {
  CONFIG: Buffer.from("config"),
  LEARNER: Buffer.from("learner"),
  ENROLLMENT: Buffer.from("enrollment"),
  CREDENTIAL: Buffer.from("credential"),
  COURSE: Buffer.from("course"),
} as const;

// --- Token-2022 XP Mint ---
// The XP token uses Token-2022 with NonTransferable (soulbound) and
// PermanentDelegate (platform can burn/adjust) extensions.
// 0 decimals: 1 token = 1 XP point.
export interface XPMintInfo {
  mintAddress: string;
  season: number;
  decimals: 0;
  extensions: ["NonTransferable", "PermanentDelegate"];
}

// --- Account Layouts (for deserialization) ---

// LearnerProfile PDA: stores per-user streak and achievement data.
// On-chain, achievementBitmap is a 256-bit bitmap where each bit
// represents one of the 15+ achievements (setBit on claim, checkBit
// to prevent double-claim, popcount for total unlocked).
export interface LearnerProfileAccount {
  authority: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDay: number;
  achievementBitmap: bigint;
  dailyXpEarned: number;
  dailyXpCap: number;
}

// Enrollment PDA: tracks per-course lesson completion.
// lessonFlags is [u64; 4] = 256 lesson slots as a bitmap.
export interface EnrollmentAccount {
  learner: string;
  course: string;
  lessonFlags: bigint[];
  enrolledAt: number;
}

// --- Bitmap Helpers ---
// Used for achievement bitmap and enrollment lesson flags.
// 3 one-liners — no full bitmap library needed.

export const setBit = (bitmap: bigint, index: number): bigint =>
  bitmap | (1n << BigInt(index));

export const checkBit = (bitmap: bigint, index: number): boolean =>
  (bitmap & (1n << BigInt(index))) !== 0n;

export const popcount = (n: bigint): number =>
  n
    .toString(2)
    .split("")
    .filter((b) => b === "1").length;
