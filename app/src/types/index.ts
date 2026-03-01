import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

export interface CourseAccount {
  courseId: string;
  creator: PublicKey;
  contentTxId: number[];
  version: number;
  lessonCount: number;
  difficulty: number;
  xpPerLesson: number;
  trackId: number;
  trackLevel: number;
  prerequisite: PublicKey | null;
  creatorRewardXp: number;
  minCompletionsForReward: number;
  totalCompletions: number;
  totalEnrollments: number;
  isActive: boolean;
  createdAt: BN;
  updatedAt: BN;
  bump: number;
}

export interface EnrollmentAccount {
  course: PublicKey;
  enrolledAt: BN;
  completedAt: BN | null;
  lessonFlags: BN[];
  credentialAsset: PublicKey | null;
  bump: number;
}

export interface ConfigAccount {
  authority: PublicKey;
  backendSigner: PublicKey;
  xpMint: PublicKey;
  bump: number;
}

export interface CourseWithKey {
  publicKey: PublicKey;
  account: CourseAccount;
}

export interface EnrollmentWithKey {
  publicKey: PublicKey;
  account: EnrollmentAccount;
}

export interface CredentialNFT {
  id: string;
  name: string;
  uri: string;
  image?: string;
  attributes?: {
    trackId?: number;
    level?: number;
    coursesCompleted?: number;
    totalXp?: number;
  };
  collection?: string;
}

export interface LeaderboardEntry {
  wallet: string;
  xpBalance: number;
  level: number;
  rank: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  history: string[];
}

export type Locale = 'en' | 'pt' | 'es';
