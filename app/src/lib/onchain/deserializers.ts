/**
 * @module deserializers
 * Buffer-level deserialization utilities for on-chain Anchor accounts.
 * Decodes raw Borsh-encoded data from Config, Course, and Enrollment PDAs.
 */

import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

// ── Buffer helpers ──────────────────────────────────────────────────────────

function readU32(buf: Buffer, offset: number): number {
  return buf.readUInt32LE(offset);
}

function readU8(buf: Buffer, offset: number): number {
  return buf.readUInt8(offset);
}

function readPubkey(buf: Buffer, offset: number): PublicKey {
  return new PublicKey(buf.subarray(offset, offset + 32));
}

function readString(
  buf: Buffer,
  offset: number,
): { value: string; length: number } {
  const len = readU32(buf, offset);
  const value = buf.subarray(offset + 4, offset + 4 + len).toString("utf8");
  return { value, length: 4 + len };
}

function readLessonFlags(buf: Buffer, offset: number): BN[] {
  const flags: BN[] = [];
  for (let i = 0; i < 4; i++) {
    const lo = buf.readUInt32LE(offset + i * 8);
    const hi = buf.readUInt32LE(offset + i * 8 + 4);
    const bn = new BN(hi).shln(32).or(new BN(lo));
    flags.push(bn);
  }
  return flags;
}

// ── Account data interfaces ─────────────────────────────────────────────────

/** Minimal deserialized Config account (program singleton). */
export interface ConfigData {
  /** Program admin who can create courses and configure settings */
  authority: PublicKey;
  /** Backend signer authorized to complete lessons and award XP */
  backendSigner: PublicKey;
  /** Token-2022 mint for soulbound XP tokens (NonTransferable) */
  xpMint: PublicKey;
}

/** Minimal deserialized Course account (PDA seeded by course ID). */
export interface CourseData {
  /** Unique string identifier matching the CMS slug */
  courseId: string;
  /** Total number of lessons in the course */
  lessonCount: number;
  /** XP awarded per lesson completion */
  xpPerLesson: number;
  /** Learning track ID (e.g. 0=Rust, 1=DeFi, 2=Security) */
  trackId: number;
  /** Credential level within the track */
  trackLevel: number;
  /** Whether the course is open for new enrollments */
  isActive: boolean;
  /** Prerequisite course PDA pubkey, or null if no prerequisite */
  prerequisite: PublicKey | null;
}

/** Minimal deserialized Enrollment account (PDA seeded by course + learner). */
export interface EnrollmentData {
  /** Public key of the associated Course PDA */
  course: PublicKey;
  /** Unix timestamp when the learner enrolled */
  enrolledAt: number;
  /** Unix timestamp when all lessons were completed, or null */
  completedAt: number | null;
  /** Bitmap array [u64; 4] tracking completed lessons (up to 256 lessons) */
  lessonFlags: BN[];
  /** Metaplex Core credential asset address, or null if not yet issued */
  credentialAsset: PublicKey | null;
}

// ── Deserializers ───────────────────────────────────────────────────────────

/** Deserialize a Config account from its raw Borsh-encoded buffer (skips 8-byte discriminator). */
export function deserializeConfig(data: Buffer): ConfigData {
  let offset = 8;
  const authority = readPubkey(data, offset);
  offset += 32;
  const backendSigner = readPubkey(data, offset);
  offset += 32;
  const xpMint = readPubkey(data, offset);
  return { authority, backendSigner, xpMint };
}

/**
 * Read the `creator` public key from a raw Course account buffer.
 * Layout after discriminator (8 bytes): courseId string (4 + len bytes), then creator (32 bytes).
 */
export function readCreatorFromCourse(data: Buffer): PublicKey {
  const courseIdLen = data.readUInt32LE(8);
  return readPubkey(data, 8 + 4 + courseIdLen);
}

/** Deserialize a Course account from its raw Borsh-encoded buffer (skips 8-byte discriminator). */
export function deserializeCourse(data: Buffer): CourseData {
  let offset = 8;
  const { value: courseId, length: courseIdLen } = readString(data, offset);
  offset += courseIdLen;
  offset += 32; // creator
  offset += 32; // authority
  offset += 32; // contentTxId
  offset += 2; // version
  const lessonCount = readU8(data, offset);
  offset += 1;
  offset += 1; // difficulty
  const xpPerLesson = readU32(data, offset);
  offset += 4;
  const trackId = data.readUInt16LE(offset);
  offset += 2;
  const trackLevel = readU8(data, offset);
  offset += 1;
  // prerequisite: Option<Pubkey> — 1 byte tag + optional 32 bytes
  const hasPrereq = readU8(data, offset);
  offset += 1;
  let prerequisite: PublicKey | null = null;
  if (hasPrereq) {
    prerequisite = readPubkey(data, offset);
    offset += 32;
  }
  offset += 4; // creatorRewardXp
  offset += 2; // minCompletionsForReward
  offset += 4; // totalCompletions
  offset += 4; // totalEnrollments
  const isActive = readU8(data, offset) === 1;
  return {
    courseId,
    lessonCount,
    xpPerLesson,
    trackId,
    trackLevel,
    isActive,
    prerequisite,
  };
}

/** Deserialize an Enrollment account from its raw Borsh-encoded buffer (skips 8-byte discriminator). */
export function deserializeEnrollment(data: Buffer): EnrollmentData {
  let offset = 8;
  const course = readPubkey(data, offset);
  offset += 32;
  offset += 2; // enrolledVersion
  // enrolledAt: i64
  const enrolledAtLo = data.readUInt32LE(offset);
  const enrolledAtHi = data.readInt32LE(offset + 4);
  const enrolledAt = enrolledAtHi * 0x100000000 + enrolledAtLo;
  offset += 8;
  // completedAt: Option<i64>
  const hasCompleted = readU8(data, offset);
  offset += 1;
  let completedAt: number | null = null;
  if (hasCompleted) {
    const compLo = data.readUInt32LE(offset);
    const compHi = data.readInt32LE(offset + 4);
    completedAt = compHi * 0x100000000 + compLo;
    offset += 8;
  }
  const lessonFlags = readLessonFlags(data, offset);
  offset += 32; // [u64; 4]
  const hasCredential = readU8(data, offset);
  offset += 1;
  const credentialAsset = hasCredential ? readPubkey(data, offset) : null;
  return { course, enrolledAt, completedAt, lessonFlags, credentialAsset };
}
