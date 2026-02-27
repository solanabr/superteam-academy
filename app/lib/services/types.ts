/**
 * Shared types for the learning platform service layer.
 * Aligned with docs/INTEGRATION.md and the on-chain Academy program.
 */

export type LeaderboardTimeframe = 'weekly' | 'monthly' | 'all-time';

export interface CourseProgress {
  courseId: string;
  completedLessonIds: string[];
  /** 256-bit bitmap on-chain; we use a list in stub */
  completedCount: number;
  totalLessons: number;
  percent: number;
}

export interface LearningProgress {
  wallet: string;
  completedLessons: Record<string, string[]>;
  courseProgress: CourseProgress[];
}

/** XP = Token-2022 balance on-chain. Level = floor(sqrt(xp / 100)) */
export interface XPBalance {
  wallet: string;
  xp: number;
  level: number;
}

/** Metaplex Core NFT, soulbound. One per track; upgrades in place. */
export interface Credential {
  mint: string;
  track: string;
  level: number;
  coursesCompleted: number;
  totalXp: number;
  metadataUri?: string;
  verificationUrl?: string;
}

/** Alias for credential display (used by legacy learningProgress.ts). */
export type CredentialSummary = Credential;

export interface LeaderboardEntry {
  rank: number;
  wallet: string;
  displayName?: string;
  xp: number;
  level: number;
  streak?: number;
}

/** Frontend-only; not on-chain */
export interface StreakData {
  wallet: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  history: { date: string; completed: number }[];
}

export interface AchievementReceipt {
  achievementId: number;
  name: string;
  metadataUri?: string;
  xpReward: number;
  mint?: string;
  claimedAt?: string;
}

/** Alias for achievement display (used by legacy learningProgress.ts). */
export type AchievementSummary = AchievementReceipt;

/** Local/legacy progress state shape (localStorage stub). */
export interface LearningProgressState {
  completedLessons: Record<string, string[]>;
  enrollments: string[];
  xp: number;
  streak: { current: number; longest: number; lastActivityDate: string | null; history: { date: string; count: number }[] };
  credentials: Credential[];
  achievements: AchievementReceipt[];
}

export interface EnrollmentResult {
  success: boolean;
  enrollmentPda?: string;
  transactionSignature?: string;
  error?: string;
}
