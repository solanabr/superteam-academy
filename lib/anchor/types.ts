import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

/**
 * On-chain Account Types
 * Mirrors the Anchor IDL account structures
 */

export interface Config {
  authority: PublicKey;
  backendSigner: PublicKey;
  xpMint: PublicKey;
  bump: number;
}

export interface Course {
  courseId: string;
  creator: PublicKey;
  contentTxId: number[]; // [u8; 32]
  lessonCount: number;
  difficulty: number;
  xpPerLesson: number;
  trackId: number;
  trackLevel: number;
  prerequisite: PublicKey | null;
  creatorRewardXp: number;
  minCompletionsForReward: number;
  completionCount: number;
  isActive: boolean;
  createdAt: number;
  bump: number;
}

export interface Enrollment {
  courseId: string;
  learner: PublicKey;
  lessonFlags: BN[]; // [u64; 4] = 256-bit bitmap
  enrolledAt: number;
  completedAt: number | null;
  credentialAsset: PublicKey | null;
  bump: number;
}

export interface MinterRole {
  minter: PublicKey;
  label: string;
  maxXpPerCall: { value: BN };
  totalXpMinted: { value: BN };
  isActive: boolean;
  createdAt: number;
  bump: number;
}

export interface AchievementType {
  achievementId: string;
  name: string;
  metadataUri: string;
  collection: PublicKey;
  currentSupply: number;
  maxSupply: number;
  xpReward: number;
  isActive: boolean;
  createdAt: number;
  bump: number;
}

export interface AchievementReceipt {
  achievementId: string;
  recipient: PublicKey;
  asset: PublicKey;
  awardedAt: number;
  bump: number;
}

/**
 * Lesson Bitmap Helpers
 */

/**
 * Check if a lesson is complete in the bitmap
 */
export function isLessonComplete(lessonFlags: BN[], lessonIndex: number): boolean {
  const wordIndex = Math.floor(lessonIndex / 64);
  const bitIndex = lessonIndex % 64;
  return !lessonFlags[wordIndex].and(new BN(1).shln(bitIndex)).isZero();
}

/**
 * Count total completed lessons
 */
export function countCompletedLessons(lessonFlags: BN[]): number {
  return lessonFlags.reduce((sum, word) => {
    let count = 0;
    let w = word.clone();
    while (!w.isZero()) {
      count += w.and(new BN(1)).toNumber();
      w = w.shrn(1);
    }
    return sum + count;
  }, 0);
}

/**
 * Get all completed lesson indices
 */
export function getCompletedLessonIndices(lessonFlags: BN[], lessonCount: number): number[] {
  const completed: number[] = [];
  for (let i = 0; i < lessonCount && i < 256; i++) {
    if (isLessonComplete(lessonFlags, i)) {
      completed.push(i);
    }
  }
  return completed;
}

/**
 * Check if course is fully complete
 */
export function isCourseComplete(lessonFlags: BN[], lessonCount: number): boolean {
  return countCompletedLessons(lessonFlags) === lessonCount;
}
