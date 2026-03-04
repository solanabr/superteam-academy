import { PublicKey } from "@solana/web3.js";
import type { BN } from "@coral-xyz/anchor";

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

export interface MinterRoleAccount {
  minter: PublicKey;
  label: string;
  maxXpPerCall: BN;
  totalXpMinted: BN;
  isActive: boolean;
  createdAt: BN;
  bump: number;
}

export interface AchievementTypeAccount {
  achievementId: string;
  name: string;
  metadataUri: string;
  collection: PublicKey;
  creator: PublicKey;
  maxSupply: number;
  currentSupply: number;
  xpReward: number;
  isActive: boolean;
  createdAt: BN;
  bump: number;
}

export interface AchievementReceiptAccount {
  asset: PublicKey;
  awardedAt: BN;
  bump: number;
}
