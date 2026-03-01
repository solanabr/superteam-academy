import { AnchorProvider, Program, BN } from '@coral-xyz/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import {
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { PROGRAM_ID, TOKEN_2022_PROGRAM_ID, XP_MINT, SOLANA_RPC_URL } from './constants';
import { getConfigPda, getCoursePda, getEnrollmentPda } from './pda';
import type { CourseAccount, EnrollmentAccount, ConfigAccount } from '@/types';

// Minimal IDL type for the program — we use manual account fetching
// In production, import generated IDL from anchor build
export type OnchainAcademy = {
  version: string;
  name: string;
};

export function getConnection(): Connection {
  return new Connection(SOLANA_RPC_URL, 'confirmed');
}

export function getXpTokenAccount(wallet: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(
    XP_MINT,
    wallet,
    false,
    TOKEN_2022_PROGRAM_ID
  );
}

/** Fetch XP balance for a wallet */
export async function fetchXpBalance(
  connection: Connection,
  wallet: PublicKey
): Promise<number> {
  try {
    const ata = getXpTokenAccount(wallet);
    const balance = await connection.getTokenAccountBalance(ata);
    return Number(balance.value.amount);
  } catch {
    return 0;
  }
}

/** Fetch all active courses from the program */
export async function fetchAllCourses(
  connection: Connection
): Promise<Array<{ publicKey: PublicKey; account: CourseAccount }>> {
  try {
    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: [
        { dataSize: 192 }, // Course account size
      ],
    });

    return accounts.map((acc) => ({
      publicKey: acc.pubkey,
      account: deserializeCourseAccount(acc.account.data),
    }));
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    return [];
  }
}

/** Fetch enrollment for a specific course and wallet */
export async function fetchEnrollment(
  connection: Connection,
  courseId: string,
  learner: PublicKey
): Promise<EnrollmentAccount | null> {
  try {
    const pda = getEnrollmentPda(courseId, learner);
    const info = await connection.getAccountInfo(pda);
    if (!info) return null;
    return deserializeEnrollmentAccount(info.data);
  } catch {
    return null;
  }
}

/** Build enroll transaction instruction */
export function buildEnrollInstruction(
  courseId: string,
  learner: PublicKey,
  prerequisiteCourseId?: string
): {
  coursePda: PublicKey;
  enrollmentPda: PublicKey;
  accounts: Array<{ pubkey: PublicKey; isWritable: boolean; isSigner: boolean }>;
} {
  const coursePda = getCoursePda(courseId);
  const enrollmentPda = getEnrollmentPda(courseId, learner);

  const remainingAccounts: Array<{
    pubkey: PublicKey;
    isWritable: boolean;
    isSigner: boolean;
  }> = [];

  if (prerequisiteCourseId) {
    const prereqCoursePda = getCoursePda(prerequisiteCourseId);
    const prereqEnrollmentPda = getEnrollmentPda(prerequisiteCourseId, learner);
    remainingAccounts.push(
      { pubkey: prereqCoursePda, isWritable: false, isSigner: false },
      { pubkey: prereqEnrollmentPda, isWritable: false, isSigner: false }
    );
  }

  return { coursePda, enrollmentPda, accounts: remainingAccounts };
}

// ─── Bitmap Helpers ───

export function isLessonComplete(lessonFlags: BN[], lessonIndex: number): boolean {
  const wordIndex = Math.floor(lessonIndex / 64);
  const bitIndex = lessonIndex % 64;
  if (!lessonFlags[wordIndex]) return false;
  return !lessonFlags[wordIndex].and(new BN(1).shln(bitIndex)).isZero();
}

export function countCompletedLessons(lessonFlags: BN[]): number {
  return lessonFlags.reduce((sum, word) => {
    let count = 0;
    const w = word.clone();
    for (let i = 0; i < 64; i++) {
      if (!w.and(new BN(1).shln(i)).isZero()) count++;
    }
    return sum + count;
  }, 0);
}

export function getCompletedLessonIndices(
  lessonFlags: BN[],
  lessonCount: number
): number[] {
  const completed: number[] = [];
  for (let i = 0; i < lessonCount; i++) {
    if (isLessonComplete(lessonFlags, i)) completed.push(i);
  }
  return completed;
}

// ─── Minimal Deserializers ───
// These parse raw account data without full IDL dependency

function deserializeCourseAccount(data: Buffer): CourseAccount {
  // Skip 8-byte discriminator
  let offset = 8;

  const courseIdLen = data.readUInt32LE(offset);
  offset += 4;
  const courseId = data.subarray(offset, offset + courseIdLen).toString('utf8');
  offset += courseIdLen;

  const creator = new PublicKey(data.subarray(offset, offset + 32));
  offset += 32;

  const contentTxId = Array.from(data.subarray(offset, offset + 32));
  offset += 32;

  const lessonCount = data.readUInt8(offset);
  offset += 1;

  const difficulty = data.readUInt8(offset);
  offset += 1;

  const xpPerLesson = data.readUInt16LE(offset);
  offset += 2;

  const trackId = data.readUInt8(offset);
  offset += 1;

  const trackLevel = data.readUInt8(offset);
  offset += 1;

  const isActive = data.readUInt8(offset) === 1;
  offset += 1;

  const totalCompletions = data.readUInt32LE(offset);
  offset += 4;

  // prerequisite is Option<String>
  const hasPrereq = data.readUInt8(offset) === 1;
  offset += 1;
  let prerequisite: string | null = null;
  if (hasPrereq) {
    const prereqLen = data.readUInt32LE(offset);
    offset += 4;
    prerequisite = data.subarray(offset, offset + prereqLen).toString('utf8');
    offset += prereqLen;
  }

  const creatorRewardXp = data.readUInt16LE(offset);
  offset += 2;

  const minCompletionsForReward = data.readUInt16LE(offset);
  offset += 2;

  const bump = data.readUInt8(offset);

  return {
    courseId,
    creator,
    contentTxId,
    lessonCount,
    difficulty,
    xpPerLesson,
    trackId,
    trackLevel,
    isActive,
    totalCompletions,
    prerequisite,
    creatorRewardXp,
    minCompletionsForReward,
    bump,
  };
}

function deserializeEnrollmentAccount(data: Buffer): EnrollmentAccount {
  let offset = 8; // skip discriminator

  const course = new PublicKey(data.subarray(offset, offset + 32));
  offset += 32;

  const learner = new PublicKey(data.subarray(offset, offset + 32));
  offset += 32;

  // lesson_flags: [u64; 4]
  const lessonFlags: BN[] = [];
  for (let i = 0; i < 4; i++) {
    lessonFlags.push(new BN(data.subarray(offset, offset + 8), 'le'));
    offset += 8;
  }

  const enrolledAt = new BN(data.subarray(offset, offset + 8), 'le');
  offset += 8;

  // completed_at: Option<i64>
  const hasCompletedAt = data.readUInt8(offset) === 1;
  offset += 1;
  const completedAt = hasCompletedAt
    ? new BN(data.subarray(offset, offset + 8), 'le')
    : null;
  if (hasCompletedAt) offset += 8;

  // credential_asset: Option<Pubkey>
  const hasCredential = data.readUInt8(offset) === 1;
  offset += 1;
  const credentialAsset = hasCredential
    ? new PublicKey(data.subarray(offset, offset + 32))
    : null;
  if (hasCredential) offset += 32;

  const bump = data.readUInt8(offset);

  return {
    course,
    learner,
    lessonFlags,
    enrolledAt,
    completedAt,
    credentialAsset,
    bump,
  };
}
