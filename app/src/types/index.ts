import type { BN } from "@coral-xyz/anchor";
import type { PublicKey } from "@solana/web3.js";

// ─── On-Chain Types ──────────────────────────────────────────────────────────

export interface OnChainCourse {
  courseId: string;
  creator: PublicKey;
  contentTxId: number[];
  lessonCount: number;
  difficulty: number;
  xpPerLesson: number;
  trackId: number;
  trackLevel: number;
  prerequisite: PublicKey | null;
  creatorRewardXp: number;
  minCompletionsForReward: number;
  isActive: boolean;
  completionCount: number;
}

export interface OnChainEnrollment {
  courseId: string;
  learner: PublicKey;
  lessonFlags: BN[];
  enrolledAt: BN;
  completedAt: BN | null;
  credentialAsset: PublicKey | null;
}

// ─── CMS Types (Sanity) ──────────────────────────────────────────────────────

export type CourseDifficulty = "beginner" | "intermediate" | "advanced";
export type LessonType = "content" | "challenge";

export interface SanityInstructor {
  _id: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  twitterHandle?: string;
}

export interface SanityTestCase {
  input: string;
  expectedOutput: string;
  description: string;
}

export interface SanityLesson {
  _id: string;
  title: string;
  type: LessonType;
  order: number;
  xpReward: number;
  content?: unknown; // Portable Text
  starterCode?: string;
  solutionCode?: string;
  testCases?: SanityTestCase[];
  estimatedMinutes?: number;
}

export interface SanityModule {
  _id: string;
  title: string;
  description?: string;
  order: number;
  lessons: SanityLesson[];
}

export interface SanityCourse {
  _id: string;
  title: string;
  slug: string;
  description: string;
  longDescription?: string;
  difficulty: CourseDifficulty;
  durationHours: number;
  xpReward: number;
  trackId: number;
  thumbnail?: string;
  instructor?: SanityInstructor;
  modules: SanityModule[];
  tags?: string[];
  prerequisiteSlug?: string;
  onChainCourseId?: string;
  publishedAt?: string;
}

// ─── User / Profile ──────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  walletAddress?: string;
  googleId?: string;
  githubId?: string;
  username?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  twitterHandle?: string;
  githubHandle?: string;
  isPublic: boolean;
  createdAt: string;
}

export interface LinkedAccount {
  id: string;
  userId: string;
  provider: "wallet" | "google" | "github";
  providerId: string;
}

// ─── Gamification ────────────────────────────────────────────────────────────

export interface XpData {
  balance: number;
  level: number;
  xpToNextLevel: number;
  xpProgress: number; // 0-1
}

export function xpToLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

export function levelToXp(level: number): number {
  return level * level * 100;
}

export function getXpData(balance: number): XpData {
  const level = xpToLevel(balance);
  const currentLevelXp = levelToXp(level);
  const nextLevelXp = levelToXp(level + 1);
  const xpInLevel = balance - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  return {
    balance,
    level,
    xpToNextLevel: xpNeeded - xpInLevel,
    xpProgress: xpInLevel / xpNeeded,
  };
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  streakHistory: string[];
}

export interface Credential {
  id: string;
  name: string;
  imageUrl?: string;
  metadataUri?: string;
  attributes: {
    trackId?: string;
    level?: string;
    coursesCompleted?: string;
    totalXp?: string;
  };
  assetAddress: string;
  mintedAt?: string;
}

export interface Achievement {
  id: string;
  achievementId: string;
  name: string;
  imageUrl?: string;
  xpReward: number;
  awardedAt: string;
  assetAddress: string;
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export type LeaderboardTimeframe = "weekly" | "monthly" | "all-time";

export interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  username?: string;
  avatarUrl?: string;
  xpBalance: number;
  level: number;
  credentialCount?: number;
}

// ─── Course Progress ─────────────────────────────────────────────────────────

export interface LessonProgress {
  lessonIndex: number;
  completed: boolean;
}

export interface CourseProgress {
  courseId: string;
  enrolled: boolean;
  enrolledAt?: string;
  completedAt?: string;
  completedLessons: number[];
  totalLessons: number;
  percentComplete: number;
  isFinalized: boolean;
  credentialAsset?: string;
}

// ─── Service Result ──────────────────────────────────────────────────────────

export interface TxResult {
  signature?: string;
  error?: string;
  success: boolean;
}

// ─── Track ───────────────────────────────────────────────────────────────────

export interface Track {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  courses: SanityCourse[];
}

export const TRACKS: Record<number, Omit<Track, "courses">> = {
  1: { id: 1, name: "Solana Basics", description: "Core Solana concepts and development", icon: "◎", color: "#14F195" },
  2: { id: 2, name: "Anchor Framework", description: "Build on-chain programs with Anchor", icon: "⚓", color: "#9945FF" },
  3: { id: 3, name: "DeFi", description: "Decentralized finance protocols", icon: "💹", color: "#00D4FF" },
  4: { id: 4, name: "NFTs & Digital Assets", description: "Metaplex and digital collectibles", icon: "🎨", color: "#F5A623" },
  5: { id: 5, name: "Full-Stack Solana", description: "End-to-end dApp development", icon: "⚡", color: "#FF4444" },
};

export const DIFFICULTY_LABELS: Record<CourseDifficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const DIFFICULTY_COLORS: Record<CourseDifficulty, string> = {
  beginner: "#14F195",
  intermediate: "#F5A623",
  advanced: "#FF4444",
};
