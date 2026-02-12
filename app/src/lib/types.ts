/**
 * Shared types for Superteam Academy LMS.
 * Aligned with on-chain program and job spec.
 */

// Use PublicKey from @solana/web3.js at runtime; this type is for service layer
export type WalletAddress = string;

export interface Progress {
  courseId: string;
  lessonFlags: number[];
  completedLessons: number;
  totalLessons: number;
  completedAt: number | null;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: number | null;
  streakFreezes: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  wallet: WalletAddress;
  displayName: string;
  xp: number;
  level: number;
  streak: number;
  avatarUrl?: string;
}

export interface Credential {
  id: string;
  wallet: WalletAddress;
  trackId: number;
  trackName: string;
  currentLevel: number;
  coursesCompleted: number;
  totalXpEarned: number;
  firstEarned: number;
  lastUpdated: number;
  metadataUri?: string;
  mintAddress?: string;
  verificationUrl?: string;
}

export type LeaderboardTimeframe = 'weekly' | 'monthly' | 'alltime';
