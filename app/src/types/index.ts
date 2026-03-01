import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

// ─── On-Chain Account Types ───

export interface ConfigAccount {
  authority: PublicKey;
  backendSigner: PublicKey;
  xpMint: PublicKey;
  bump: number;
}

export interface CourseAccount {
  courseId: string;
  creator: PublicKey;
  contentTxId: number[];
  lessonCount: number;
  difficulty: number;
  xpPerLesson: number;
  trackId: number;
  trackLevel: number;
  isActive: boolean;
  totalCompletions: number;
  prerequisite: string | null;
  creatorRewardXp: number;
  minCompletionsForReward: number;
  bump: number;
}

export interface EnrollmentAccount {
  course: PublicKey;
  learner: PublicKey;
  lessonFlags: BN[];
  enrolledAt: BN;
  completedAt: BN | null;
  credentialAsset: PublicKey | null;
  bump: number;
}

export interface MinterRoleAccount {
  minter: PublicKey;
  label: string;
  isActive: boolean;
  totalXpMinted: BN;
  maxXpPerCall: BN;
  bump: number;
}

export interface AchievementTypeAccount {
  achievementId: string;
  name: string;
  metadataUri: string;
  collection: PublicKey;
  currentSupply: number;
  maxSupply: number;
  xpReward: number;
  isActive: boolean;
  bump: number;
}

// ─── Frontend Display Types ───

export interface Course {
  publicKey: string;
  courseId: string;
  title: string;
  description: string;
  creator: string;
  lessonCount: number;
  difficulty: 1 | 2 | 3;
  xpPerLesson: number;
  totalXp: number;
  trackId: number;
  trackLevel: number;
  isActive: boolean;
  totalCompletions: number;
  prerequisite: string | null;
  imageUrl?: string;
  tags?: string[];
}

export interface LessonProgress {
  courseId: string;
  completedLessons: number[];
  totalLessons: number;
  completedAt: number | null;
  enrolledAt: number;
  progressPercent: number;
}

export interface Credential {
  assetAddress: string;
  name: string;
  imageUrl: string;
  trackId: number;
  coursesCompleted: number;
  totalXp: number;
  awardedAt: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  xpReward: number;
  earned: boolean;
  earnedAt?: number;
}

export interface LeaderboardEntry {
  rank: number;
  wallet: string;
  displayName?: string;
  xp: number;
  level: number;
  credentialCount: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  activityLog: Record<string, boolean>;
}

export interface UserProfile {
  wallet: string;
  xp: number;
  level: number;
  streak: StreakData;
  enrolledCourses: number;
  completedCourses: number;
  credentials: Credential[];
  achievements: Achievement[];
}

// ─── Sanity CMS Types ───

export interface SanityCourse {
  _id: string;
  courseId: string;
  title: string;
  description: string;
  longDescription?: string;
  imageUrl?: string;
  tags?: string[];
  lessons: SanityLesson[];
}

export interface SanityLesson {
  _key: string;
  title: string;
  content: string;
  codeChallenge?: {
    starterCode: string;
    solution: string;
    language: 'rust' | 'typescript';
    instructions: string;
  };
  quiz?: {
    question: string;
    options: string[];
    correctIndex: number;
  };
}

// ─── Utility Types ───

export type Difficulty = 1 | 2 | 3;
export type TimeFrame = 'weekly' | 'monthly' | 'all-time';
export type Locale = 'en' | 'pt-BR' | 'es';
