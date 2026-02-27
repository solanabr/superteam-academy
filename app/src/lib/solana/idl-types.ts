/**
 * Superteam Academy IDL Types
 * TypeScript types matching the Anchor program IDL
 */
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

// ==================== Account Types ====================

/**
 * Config PDA - Singleton platform configuration
 * Seeds: ["config"]
 */
export interface ConfigAccount {
  authority: PublicKey;
  backendSigner: PublicKey;
  xpMint: PublicKey;
  bump: number;
  reserved: number[];
}

/**
 * Course PDA - Course metadata
 * Seeds: ["course", course_id.as_bytes()]
 */
export interface CourseAccount {
  courseId: string;
  creator: PublicKey;
  contentTxId: number[]; // 43 bytes - Arweave TX ID
  lessonCount: number;
  difficulty: number; // 1=beginner, 2=intermediate, 3=advanced
  xpPerLesson: number;
  trackId: number;
  trackLevel: number;
  prerequisite: string | null;
  creatorRewardXp: number;
  minCompletionsForReward: number;
  totalCompletions: number;
  isActive: boolean;
  createdAt: BN;
  updatedAt: BN;
  bump: number;
  reserved: number[];
}

/**
 * Enrollment PDA - Per-learner course progress
 * Seeds: ["enrollment", course_id.as_bytes(), user.key()]
 */
export interface EnrollmentAccount {
  courseId: string;
  learner: PublicKey;
  lessonFlags: BN[]; // Bitmap for lesson completion (up to 256 lessons)
  enrolledAt: BN;
  completedAt: BN | null;
  credentialAsset: PublicKey | null;
  bump: number;
  reserved: number[];
}

/**
 * MinterRole PDA - Registered XP minter
 * Seeds: ["minter", minter.key()]
 */
export interface MinterRoleAccount {
  minter: PublicKey;
  label: string;
  maxXpPerCall: BN; // 0 = unlimited
  totalXpMinted: BN;
  isActive: boolean;
  createdAt: BN;
  bump: number;
  reserved: number[];
}

/**
 * AchievementType PDA - Achievement definition
 * Seeds: ["achievement", achievement_id.as_bytes()]
 */
export interface AchievementTypeAccount {
  achievementId: string;
  name: string;
  metadataUri: string;
  collection: PublicKey;
  maxSupply: number; // 0 = unlimited
  currentSupply: number;
  xpReward: number;
  isActive: boolean;
  createdAt: BN;
  bump: number;
  reserved: number[];
}

/**
 * AchievementReceipt PDA - Proof of award
 * Seeds: ["achievement_receipt", achievement_id.as_bytes(), recipient.key()]
 */
export interface AchievementReceiptAccount {
  achievementId: string;
  recipient: PublicKey;
  asset: PublicKey;
  awardedAt: BN;
  bump: number;
}

// ==================== Instruction Args ====================

export interface CreateCourseArgs {
  courseId: string;
  creator: PublicKey;
  contentTxId: number[];
  lessonCount: number;
  difficulty: number;
  xpPerLesson: number;
  trackId: number;
  trackLevel: number;
  prerequisite: string | null;
  creatorRewardXp: number;
  minCompletionsForReward: number;
}

export interface UpdateCourseArgs {
  newContentTxId: number[] | null;
  newIsActive: boolean | null;
  newXpPerLesson: number | null;
  newCreatorRewardXp: number | null;
  newMinCompletionsForReward: number | null;
}

export interface UpdateConfigArgs {
  newBackendSigner: PublicKey | null;
}

export interface RegisterMinterArgs {
  minter: PublicKey;
  label: string;
  maxXpPerCall: BN;
}

export interface CreateAchievementTypeArgs {
  achievementId: string;
  name: string;
  metadataUri: string;
  maxSupply: number;
  xpReward: number;
}

// ==================== Events ====================

export interface EnrolledEvent {
  courseId: string;
  learner: PublicKey;
  enrolledAt: BN;
}

export interface LessonCompletedEvent {
  courseId: string;
  learner: PublicKey;
  lessonIndex: number;
  xpAwarded: number;
  timestamp: BN;
}

export interface CourseFinalizedEvent {
  courseId: string;
  learner: PublicKey;
  totalXpAwarded: BN;
  completionBonus: BN;
  creatorRewardXp: number | null;
  completedAt: BN;
}

export interface CredentialIssuedEvent {
  courseId: string;
  learner: PublicKey;
  credentialAsset: PublicKey;
  credentialName: string;
  credentialCreated: boolean;
  credentialUpgraded: boolean;
}

export interface EnrollmentClosedEvent {
  courseId: string;
  learner: PublicKey;
  wasCompleted: boolean;
  rentReclaimed: BN;
}

export interface XpRewardedEvent {
  recipient: PublicKey;
  amount: BN;
  minter: PublicKey;
  reason: string;
}

export interface AchievementAwardedEvent {
  achievementId: string;
  recipient: PublicKey;
  asset: PublicKey;
  xpAwarded: number;
}

// ==================== Error Codes ====================

export enum ProgramErrorCode {
  Unauthorized = 6000,
  CourseNotActive = 6001,
  LessonOutOfBounds = 6002,
  LessonAlreadyCompleted = 6003,
  CourseNotCompleted = 6004,
  CourseAlreadyFinalized = 6005,
  CourseNotFinalized = 6006,
  PrerequisiteNotMet = 6007,
  UnenrollCooldown = 6008,
  EnrollmentCourseMismatch = 6009,
  Overflow = 6010,
  CourseIdEmpty = 6011,
  CourseIdTooLong = 6012,
  InvalidLessonCount = 6013,
  InvalidDifficulty = 6014,
  CredentialAssetMismatch = 6015,
  CredentialAlreadyIssued = 6016,
  MinterNotActive = 6017,
  MinterAmountExceeded = 6018,
  LabelTooLong = 6019,
  AchievementNotActive = 6020,
  AchievementSupplyExhausted = 6021,
  AchievementIdTooLong = 6022,
  AchievementNameTooLong = 6023,
  AchievementUriTooLong = 6024,
  InvalidAmount = 6025,
  InvalidXpReward = 6026,
}

export const ERROR_MESSAGES: Record<number, string> = {
  [ProgramErrorCode.Unauthorized]: 'Unauthorized signer',
  [ProgramErrorCode.CourseNotActive]: 'Course not active',
  [ProgramErrorCode.LessonOutOfBounds]: 'Lesson index out of bounds',
  [ProgramErrorCode.LessonAlreadyCompleted]: 'Lesson already completed',
  [ProgramErrorCode.CourseNotCompleted]: 'Not all lessons completed',
  [ProgramErrorCode.CourseAlreadyFinalized]: 'Course already finalized',
  [ProgramErrorCode.CourseNotFinalized]: 'Course not finalized',
  [ProgramErrorCode.PrerequisiteNotMet]: 'Prerequisite not met',
  [ProgramErrorCode.UnenrollCooldown]: 'Close cooldown not met (24h)',
  [ProgramErrorCode.EnrollmentCourseMismatch]: 'Enrollment/course mismatch',
  [ProgramErrorCode.Overflow]: 'Arithmetic overflow',
  [ProgramErrorCode.CourseIdEmpty]: 'Course ID is empty',
  [ProgramErrorCode.CourseIdTooLong]: 'Course ID exceeds max length',
  [ProgramErrorCode.InvalidLessonCount]: 'Lesson count must be at least 1',
  [ProgramErrorCode.InvalidDifficulty]: 'Difficulty must be 1, 2, or 3',
  [ProgramErrorCode.CredentialAssetMismatch]: 'Credential asset does not match enrollment record',
  [ProgramErrorCode.CredentialAlreadyIssued]: 'Credential already issued for this enrollment',
  [ProgramErrorCode.MinterNotActive]: 'Minter role is not active',
  [ProgramErrorCode.MinterAmountExceeded]: "Amount exceeds minter's per-call limit",
  [ProgramErrorCode.LabelTooLong]: 'Minter label exceeds max length',
  [ProgramErrorCode.AchievementNotActive]: 'Achievement type is not active',
  [ProgramErrorCode.AchievementSupplyExhausted]: 'Achievement max supply reached',
  [ProgramErrorCode.AchievementIdTooLong]: 'Achievement ID exceeds max length',
  [ProgramErrorCode.AchievementNameTooLong]: 'Achievement name exceeds max length',
  [ProgramErrorCode.AchievementUriTooLong]: 'Achievement URI exceeds max length',
  [ProgramErrorCode.InvalidAmount]: 'Amount must be greater than zero',
  [ProgramErrorCode.InvalidXpReward]: 'XP reward must be greater than zero',
};

// ==================== Utility Types ====================

export interface CourseWithMetadata extends CourseAccount {
  pda: PublicKey;
  trackName: string;
  difficultyName: string;
}

export interface EnrollmentWithProgress extends EnrollmentAccount {
  pda: PublicKey;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  isCompleted: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  wallet: PublicKey;
  xpBalance: number;
  level: number;
  displayName?: string;
  avatar?: string;
}
