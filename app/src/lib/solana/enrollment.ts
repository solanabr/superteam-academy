import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import type { CourseProgress } from "@/types";
import { PROGRAM_ID, deriveCoursePda, deriveEnrollmentPda } from "./constants";

/**
 * Anchor discriminator for `enroll` instruction.
 * Computed: SHA256("global:enroll")[0..8]
 */
const ENROLL_DISCRIMINATOR = Buffer.from([58, 12, 36, 3, 142, 28, 1, 43]);

/**
 * Build the raw `enroll` TransactionInstruction.
 * No IDL/Anchor Program required — just web3.js.
 */
export function buildEnrollInstruction(
  courseId: string,
  learner: PublicKey,
): TransactionInstruction {
  const [coursePda] = deriveCoursePda(courseId);
  const [enrollmentPda] = deriveEnrollmentPda(courseId, learner);

  // Borsh serialize courseId as String: 4-byte LE length + UTF-8 bytes
  const courseIdBytes = Buffer.from(courseId, "utf-8");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32LE(courseIdBytes.length);
  const data = Buffer.concat([ENROLL_DISCRIMINATOR, lenBuf, courseIdBytes]);

  return new TransactionInstruction({
    keys: [
      { pubkey: coursePda, isSigner: false, isWritable: true },
      { pubkey: enrollmentPda, isSigner: false, isWritable: true },
      { pubkey: learner, isSigner: true, isWritable: true },
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
    ],
    programId: PROGRAM_ID,
    data,
  });
}

/* ── Enrollment Account Deserialization ── */

/**
 * Enrollment account layout (127 bytes):
 *  8  discriminator
 * 32  course (Pubkey)
 *  8  enrolled_at (i64)
 *  1  completed_at option tag
 *  8  completed_at value (i64)
 * 32  lesson_flags ([u64; 4])
 *  1  credential_asset option tag
 * 32  credential_asset value (Pubkey)
 *  4  _reserved
 *  1  bump
 */
export function deserializeEnrollment(
  data: Buffer,
  courseId: string,
): CourseProgress | null {
  if (data.length < 127) return null;

  let offset = 8; // skip discriminator

  // course: Pubkey (32 bytes) — skip, we know the courseId
  offset += 32;

  // enrolled_at: i64 (seconds → ms)
  const enrolledAt = Number(data.readBigInt64LE(offset)) * 1000;
  offset += 8;

  // completed_at: Option<i64>
  const hasCompletedAt = data[offset] === 1;
  offset += 1;
  const completedAt = hasCompletedAt
    ? Number(data.readBigInt64LE(offset)) * 1000
    : null;
  offset += 8;

  // lesson_flags: [u64; 4] (32 bytes)
  const lessonFlags: bigint[] = [];
  for (let i = 0; i < 4; i++) {
    lessonFlags.push(data.readBigUInt64LE(offset));
    offset += 8;
  }

  // credential_asset: Option<Pubkey>
  const hasCredential = data[offset] === 1;
  offset += 1;
  const credentialAsset = hasCredential
    ? new PublicKey(data.subarray(offset, offset + 32)).toBase58()
    : null;

  const completedLessons = getCompletedLessonIndices(lessonFlags);

  return {
    courseId,
    enrolledAt,
    completedAt,
    completedLessons,
    totalLessons: completedLessons.length, // overridden with course data by caller
    credentialAsset,
  };
}

/* ── Bitmap Helpers ── */

export function getCompletedLessonIndices(
  lessonFlags: bigint[],
  maxLessons: number = 256,
): number[] {
  const completed: number[] = [];
  for (let i = 0; i < maxLessons; i++) {
    const wordIndex = Math.floor(i / 64);
    const bitIndex = i % 64;
    const word = lessonFlags[wordIndex];
    if (word !== undefined && (word >> BigInt(bitIndex)) & BigInt(1)) {
      completed.push(i);
    }
  }
  return completed;
}

export function isLessonComplete(
  lessonFlags: bigint[],
  lessonIndex: number,
): boolean {
  const wordIndex = Math.floor(lessonIndex / 64);
  const bitIndex = lessonIndex % 64;
  const word = lessonFlags[wordIndex];
  if (word === undefined) return false;
  return !!((word >> BigInt(bitIndex)) & BigInt(1));
}
