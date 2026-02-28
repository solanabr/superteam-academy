import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

/**
 * TypeScript type definitions for the Superteam Academy on-chain program accounts.
 * Manually derived from docs/SPEC.md v3.0 — no IDL JSON available yet.
 *
 * These types mirror the Anchor account structs defined in the program's
 * `state/` module. Field order and types match the on-chain layout.
 */

/** Singleton platform configuration — Seeds: ["config"] — 113 bytes */
export interface Config {
  authority: PublicKey;
  backendSigner: PublicKey;
  xpMint: PublicKey;
  bump: number;
  reserved: number[];
}

/** Course metadata and reward parameters — Seeds: ["course", course_id] — 192 bytes */
export interface Course {
  courseId: string;
  creator: PublicKey;
  /** Arweave transaction ID — [u8; 32] */
  contentTxId: number[];
  /** Total lessons in the course — u16 */
  lessonCount: number;
  /** 1 = beginner, 2 = intermediate, 3 = advanced — u8 */
  difficulty: number;
  /** XP minted per completed lesson — u32 */
  xpPerLesson: number;
  /** Track identifier for credential grouping — u8 */
  trackId: number;
  /** Level within the track — u8 */
  trackLevel: number;
  /** Course ID of prerequisite, or null — Option<String> */
  prerequisite: string | null;
  /** XP reward for the course creator — u32 */
  creatorRewardXp: number;
  /** Completions required before creator reward unlocks — u16 */
  minCompletionsForReward: number;
  /** Running count of learners who finalized — u32 */
  completionCount: number;
  /** Whether enrollments are accepted — bool */
  isActive: boolean;
  /** Whether creator has been rewarded — bool */
  creatorRewarded: boolean;
  bump: number;
  reserved: number[];
}

/**
 * Per-learner enrollment in a course.
 * Seeds: ["enrollment", course_id, learner.key()] — 127 bytes
 */
export interface Enrollment {
  courseId: string;
  learner: PublicKey;
  /** Lesson completion bitmap — [u64; 4] (256 bits, one per possible lesson) */
  lessonFlags: BN[];
  /** Unix timestamp of enrollment — i64 */
  enrolledAt: BN;
  /** Unix timestamp of course finalization, or null — Option<i64> */
  completedAt: BN | null;
  /** Metaplex Core credential asset pubkey, or null — Option<Pubkey> */
  credentialAsset: PublicKey | null;
  bump: number;
  reserved: number[];
}

/**
 * Registered XP minter with per-call cap.
 * Seeds: ["minter", minter.key()] — 110 bytes
 */
export interface MinterRole {
  minter: PublicKey;
  label: string;
  /** Maximum XP this minter can award per call (0 = unlimited) — u64 */
  maxXpPerCall: BN;
  /** Running total of XP minted by this role — u64 */
  totalXpMinted: BN;
  isActive: boolean;
  bump: number;
  reserved: number[];
}

/**
 * Achievement definition with supply cap and XP reward.
 * Seeds: ["achievement", achievement_id] — 338 bytes
 */
export interface AchievementType {
  achievementId: string;
  name: string;
  metadataUri: string;
  /** Metaplex Core collection pubkey for this achievement */
  collection: PublicKey;
  /** Maximum number of NFTs that can be minted — u32 */
  maxSupply: number;
  /** Number of achievement NFTs minted so far — u32 */
  currentSupply: number;
  /** XP reward minted upon award — u32 */
  xpReward: number;
  isActive: boolean;
  bump: number;
  reserved: number[];
}

/**
 * Proof that a recipient was awarded a specific achievement.
 * Seeds: ["achievement_receipt", achievement_id, recipient.key()] — 49 bytes
 * Init collision prevents double-awarding.
 */
export interface AchievementReceipt {
  achievementId: string;
  recipient: PublicKey;
  /** Metaplex Core NFT asset pubkey */
  asset: PublicKey;
  /** Unix timestamp of award — i64 */
  awardedAt: BN;
  bump: number;
}
