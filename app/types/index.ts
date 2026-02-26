import { PublicKey } from "@solana/web3.js";

export interface Course {
  publicKey: PublicKey;
  courseId: string;
  creator: PublicKey;
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
}

export interface Enrollment {
  publicKey: PublicKey;
  courseId: string;
  learner: PublicKey;
  lessonFlags: bigint[];
  enrolledAt: number;
  completedAt: number | null;
  credentialAsset: PublicKey | null;
}

export interface AchievementType {
  publicKey: PublicKey;
  achievementId: string;
  name: string;
  metadataUri: string;
  maxSupply: number;
  currentSupply: number;
  xpReward: number;
  isActive: boolean;
}

export interface AchievementReceipt {
  publicKey: PublicKey;
  achievementId: string;
  recipient: PublicKey;
  asset: PublicKey;
  awardedAt: number;
}

export interface CredentialNFT {
  mint: string;
  name: string;
  image: string;
  trackId: number;
  level: number;
  coursesCompleted: number;
  totalXp: number;
  collection: string;
}

export interface LeaderboardEntry {
  wallet: string;
  xp: number;
  level: number;
  rank: number;
}

export interface UserProfile {
  wallet: string;
  xp: number;
  level: number;
  enrollments: Enrollment[];
  credentials: CredentialNFT[];
  achievements: AchievementReceipt[];
}

export interface MockCourse {
  id: string;
  title: string;
  description: string;
  difficulty: 1 | 2 | 3;
  duration: string;
  lessons: number;
  xp: number;
  track: string;
  trackId: number;
  image: string;
  tags: string[];
  instructor: string;
  enrolled?: number;
  rating?: number;
}