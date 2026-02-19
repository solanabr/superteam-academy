// On-chain account types for the Superteam Academy Solana program.
// These map to the 6 PDA accounts defined in the Anchor program.
// Used for type-safe deserialization of on-chain reads.

// --- PDA Seeds (matches program's seeds in instructions/) ---
export const PDA_SEEDS = {
  CONFIG: Buffer.from("config"),
  COURSE: Buffer.from("course"),
  ENROLLMENT: Buffer.from("enrollment"),
  MINTER: Buffer.from("minter"),
  ACHIEVEMENT: Buffer.from("achievement"),
  ACHIEVEMENT_RECEIPT: Buffer.from("achievement_receipt"),
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

// Config PDA: global program configuration, created by `initialize`.
// Seeds: ["config"]
export interface ConfigAccount {
  authority: string;
  backendSigner: string;
  xpMint: string;
  season: number;
  totalCoursesCreated: number;
  platformVersion: number;
}

// Course PDA: per-course settings, created by `create_course`.
// Seeds: ["course", courseId]
export interface CourseAccount {
  courseId: string;
  authority: string;
  xpPerLesson: bigint;
  lessonCount: number;
  totalEnrollments: number;
  totalCompletions: number;
  trackCollection: string | null;
  contentTxId: string;
  active: boolean;
  prerequisiteCourse: string | null;
  minCompletionsForReward: number;
  creatorRewardClaimed: boolean;
}

// Enrollment PDA: tracks per-learner-per-course progress.
// Seeds: ["enrollment", courseId, learner]
// lessonFlags is [u64; 4] = 256 lesson slots as a bitmap.
export interface EnrollmentAccount {
  learner: string;
  course: string;
  lessonFlags: bigint[];
  enrolledAt: number;
  completedAt: number | null;
  credentialAsset: string | null;
  xpEarned: bigint;
}

// MinterRole PDA: grants an address permission to call completeLesson.
// Seeds: ["minter", minter]
export interface MinterRoleAccount {
  minter: string;
  authority: string;
  active: boolean;
}

// AchievementType PDA: defines an achievement category.
// Seeds: ["achievement", achievementId]
export interface AchievementTypeAccount {
  achievementId: string;
  authority: string;
  maxAwards: number;
  totalAwarded: number;
  active: boolean;
}

// AchievementReceipt PDA: proof a user earned an achievement.
// Seeds: ["achievement_receipt", achievementId, recipient]
export interface AchievementReceiptAccount {
  recipient: string;
  achievementType: string;
  awardedAt: number;
}

// --- Bitmap Helpers ---
// Used for enrollment lesson flags (256-bit bitmap across 4 u64 words).

export const setBit = (bitmap: bigint, index: number): bigint =>
  bitmap | (1n << BigInt(index));

export const checkBit = (bitmap: bigint, index: number): boolean =>
  (bitmap & (1n << BigInt(index))) !== 0n;

export const popcount = (n: bigint): number =>
  n
    .toString(2)
    .split("")
    .filter((b) => b === "1").length;
