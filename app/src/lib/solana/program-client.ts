/**
 * Superteam Academy Program Client
 * Provides methods to interact with the on-chain Anchor program
 */
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import {
  PROGRAM_ID,
  XP_MINT,
  TOKEN_2022_PROGRAM_ID,
  MPL_CORE_PROGRAM_ID,
  RPC_ENDPOINTS,
  NETWORK,
  TRACK_IDS,
  DIFFICULTY_LEVELS,
} from './program-config';
import {
  deriveConfigPda,
  deriveCoursePda,
  deriveEnrollmentPda,
  deriveAchievementTypePda,
  deriveAchievementReceiptPda,
  deriveXpTokenAccount,
} from './pda';
import type {
  ConfigAccount,
  CourseAccount,
  EnrollmentAccount,
  AchievementTypeAccount,
  CourseWithMetadata,
  EnrollmentWithProgress,
  LeaderboardEntry,
} from './idl-types';

// ==================== Connection ====================

let connection: Connection | null = null;

export function getConnection(): Connection {
  if (!connection) {
    const endpoint = RPC_ENDPOINTS[NETWORK as keyof typeof RPC_ENDPOINTS];
    connection = new Connection(endpoint, 'confirmed');
  }
  return connection;
}

// ==================== Account Fetching ====================

/**
 * Fetch the Config account
 */
export async function fetchConfig(): Promise<ConfigAccount | null> {
  try {
    const conn = getConnection();
    const [configPda] = deriveConfigPda();
    const accountInfo = await conn.getAccountInfo(configPda);

    if (!accountInfo) return null;

    // Parse account data (skip 8-byte discriminator)
    const data = accountInfo.data.slice(8);
    return parseConfigAccount(data);
  } catch (error) {
    console.error('Error fetching config:', error);
    return null;
  }
}

/**
 * Fetch a Course account by ID
 */
export async function fetchCourse(courseId: string): Promise<CourseWithMetadata | null> {
  try {
    const conn = getConnection();
    const [coursePda] = deriveCoursePda(courseId);
    const accountInfo = await conn.getAccountInfo(coursePda);

    if (!accountInfo) return null;

    const data = accountInfo.data.slice(8);
    const course = parseCourseAccount(data);

    return {
      ...course,
      pda: coursePda,
      trackName: TRACK_IDS[course.trackId] || `track-${course.trackId}`,
      difficultyName: DIFFICULTY_LEVELS[course.difficulty] || 'unknown',
    };
  } catch (error) {
    console.error('Error fetching course:', error);
    return null;
  }
}

/**
 * Fetch all active courses
 */
export async function fetchAllCourses(): Promise<CourseWithMetadata[]> {
  try {
    const conn = getConnection();

    // Get all program accounts for Course type
    const accounts = await conn.getProgramAccounts(PROGRAM_ID, {
      filters: [
        { dataSize: 192 }, // Course account size
      ],
    });

    const courses: CourseWithMetadata[] = [];

    for (const { pubkey, account } of accounts) {
      try {
        const data = account.data.slice(8);
        const course = parseCourseAccount(data);

        if (course.isActive) {
          courses.push({
            ...course,
            pda: pubkey,
            trackName: TRACK_IDS[course.trackId] || `track-${course.trackId}`,
            difficultyName: DIFFICULTY_LEVELS[course.difficulty] || 'unknown',
          });
        }
      } catch {
        // Skip invalid accounts
      }
    }

    return courses;
  } catch (error) {
    console.error('Error fetching all courses:', error);
    return [];
  }
}

/**
 * Fetch an Enrollment account
 */
export async function fetchEnrollment(
  courseId: string,
  learner: PublicKey
): Promise<EnrollmentWithProgress | null> {
  try {
    const conn = getConnection();
    const [enrollmentPda] = deriveEnrollmentPda(courseId, learner);
    const accountInfo = await conn.getAccountInfo(enrollmentPda);

    if (!accountInfo) return null;

    const data = accountInfo.data.slice(8);
    const enrollment = parseEnrollmentAccount(data);

    // Fetch course to get total lessons
    const course = await fetchCourse(courseId);
    const totalLessons = course?.lessonCount || 0;

    // Count completed lessons from bitmap
    const completedLessons = countCompletedLessons(enrollment.lessonFlags);
    const progressPercent =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return {
      ...enrollment,
      pda: enrollmentPda,
      completedLessons,
      totalLessons,
      progressPercent,
      isCompleted: enrollment.completedAt !== null,
    };
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    return null;
  }
}

/**
 * Fetch all enrollments for a learner
 */
export async function fetchLearnerEnrollments(
  learner: PublicKey
): Promise<EnrollmentWithProgress[]> {
  try {
    const conn = getConnection();

    // Get all enrollment accounts for this learner
    const accounts = await conn.getProgramAccounts(PROGRAM_ID, {
      filters: [
        { dataSize: 127 }, // Enrollment account size
        {
          memcmp: {
            offset: 8 + 32, // Skip discriminator + courseId space
            bytes: learner.toBase58(),
          },
        },
      ],
    });

    const enrollments: EnrollmentWithProgress[] = [];

    for (const { pubkey, account } of accounts) {
      try {
        const data = account.data.slice(8);
        const enrollment = parseEnrollmentAccount(data);

        // Fetch course info
        const course = await fetchCourse(enrollment.courseId);
        const totalLessons = course?.lessonCount || 0;
        const completedLessons = countCompletedLessons(enrollment.lessonFlags);

        enrollments.push({
          ...enrollment,
          pda: pubkey,
          completedLessons,
          totalLessons,
          progressPercent:
            totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
          isCompleted: enrollment.completedAt !== null,
        });
      } catch {
        // Skip invalid accounts
      }
    }

    return enrollments;
  } catch (error) {
    console.error('Error fetching learner enrollments:', error);
    return [];
  }
}

// ==================== XP Balance ====================

/**
 * Fetch XP balance for a wallet (Token-2022)
 */
export async function fetchXpBalance(wallet: PublicKey): Promise<number> {
  try {
    const conn = getConnection();
    const xpAta = deriveXpTokenAccount(wallet, XP_MINT);

    const balance = await conn.getTokenAccountBalance(xpAta);
    return Number(balance.value.amount);
  } catch {
    // Account might not exist yet
    return 0;
  }
}

/**
 * Calculate level from XP
 * Level = floor(sqrt(totalXP / 100))
 */
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

/**
 * Calculate XP needed for next level
 */
export function xpForNextLevel(currentLevel: number): number {
  const nextLevel = currentLevel + 1;
  return nextLevel * nextLevel * 100;
}

// ==================== Transaction Building ====================

/**
 * Build enroll transaction (learner signs)
 */
export async function buildEnrollTransaction(
  courseId: string,
  learner: PublicKey,
  prerequisiteCourseId?: string
): Promise<Transaction> {
  const conn = getConnection();
  const [configPda] = deriveConfigPda();
  const [coursePda] = deriveCoursePda(courseId);
  const [enrollmentPda] = deriveEnrollmentPda(courseId, learner);

  // Build instruction manually (simplified - in production use Anchor)
  const instruction = {
    keys: [
      { pubkey: coursePda, isSigner: false, isWritable: false },
      { pubkey: enrollmentPda, isSigner: false, isWritable: true },
      { pubkey: learner, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data: Buffer.from([
      // Enroll instruction discriminator
      0x09,
      0x16,
      0x38,
      0x3d,
      0x6b,
      0xf9,
      0x90,
      0x02,
      // Course ID as string
      ...Buffer.from(courseId),
    ]),
  };

  // Add prerequisite accounts if needed
  if (prerequisiteCourseId) {
    const [prereqCoursePda] = deriveCoursePda(prerequisiteCourseId);
    const [prereqEnrollmentPda] = deriveEnrollmentPda(prerequisiteCourseId, learner);

    instruction.keys.push(
      { pubkey: prereqCoursePda, isSigner: false, isWritable: false },
      { pubkey: prereqEnrollmentPda, isSigner: false, isWritable: false }
    );
  }

  const transaction = new Transaction().add(instruction);
  const { blockhash } = await conn.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = learner;

  return transaction;
}

/**
 * Build close enrollment transaction (learner signs)
 */
export async function buildCloseEnrollmentTransaction(
  courseId: string,
  learner: PublicKey
): Promise<Transaction> {
  const conn = getConnection();
  const [coursePda] = deriveCoursePda(courseId);
  const [enrollmentPda] = deriveEnrollmentPda(courseId, learner);

  const instruction = {
    keys: [
      { pubkey: coursePda, isSigner: false, isWritable: false },
      { pubkey: enrollmentPda, isSigner: false, isWritable: true },
      { pubkey: learner, isSigner: true, isWritable: true },
    ],
    programId: PROGRAM_ID,
    data: Buffer.from([
      // CloseEnrollment instruction discriminator
      0x6b, 0x2e, 0x89, 0x1a, 0xc4, 0xf5, 0x32, 0x11,
    ]),
  };

  const transaction = new Transaction().add(instruction);
  const { blockhash } = await conn.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = learner;

  return transaction;
}

// ==================== Account Parsing Helpers ====================

function parseConfigAccount(data: Buffer): ConfigAccount {
  let offset = 0;

  const authority = new PublicKey(data.slice(offset, offset + 32));
  offset += 32;

  const backendSigner = new PublicKey(data.slice(offset, offset + 32));
  offset += 32;

  const xpMint = new PublicKey(data.slice(offset, offset + 32));
  offset += 32;

  const bump = data[offset];
  offset += 1;

  const reserved = Array.from(data.slice(offset, offset + 8));

  return { authority, backendSigner, xpMint, bump, reserved };
}

function parseCourseAccount(data: Buffer): CourseAccount {
  let offset = 0;

  // Parse string length and value for courseId
  const courseIdLen = data.readUInt32LE(offset);
  offset += 4;
  const courseId = data.slice(offset, offset + courseIdLen).toString('utf8');
  offset += courseIdLen;

  const creator = new PublicKey(data.slice(offset, offset + 32));
  offset += 32;

  const contentTxId = Array.from(data.slice(offset, offset + 43));
  offset += 43;

  const lessonCount = data[offset];
  offset += 1;

  const difficulty = data[offset];
  offset += 1;

  const xpPerLesson = data.readUInt16LE(offset);
  offset += 2;

  const trackId = data[offset];
  offset += 1;

  const trackLevel = data[offset];
  offset += 1;

  // Parse optional prerequisite
  const hasPrereq = data[offset] === 1;
  offset += 1;
  let prerequisite: string | null = null;
  if (hasPrereq) {
    const prereqLen = data.readUInt32LE(offset);
    offset += 4;
    prerequisite = data.slice(offset, offset + prereqLen).toString('utf8');
    offset += prereqLen;
  }

  const creatorRewardXp = data.readUInt16LE(offset);
  offset += 2;

  const minCompletionsForReward = data.readUInt16LE(offset);
  offset += 2;

  const totalCompletions = data.readUInt32LE(offset);
  offset += 4;

  const isActive = data[offset] === 1;
  offset += 1;

  const createdAt = new BN(data.slice(offset, offset + 8), 'le');
  offset += 8;

  const updatedAt = new BN(data.slice(offset, offset + 8), 'le');
  offset += 8;

  const bump = data[offset];
  offset += 1;

  const reserved = Array.from(data.slice(offset, offset + 8));

  return {
    courseId,
    creator,
    contentTxId,
    lessonCount,
    difficulty,
    xpPerLesson,
    trackId,
    trackLevel,
    prerequisite,
    creatorRewardXp,
    minCompletionsForReward,
    totalCompletions,
    isActive,
    createdAt,
    updatedAt,
    bump,
    reserved,
  };
}

function parseEnrollmentAccount(data: Buffer): EnrollmentAccount {
  let offset = 0;

  // Parse courseId
  const courseIdLen = data.readUInt32LE(offset);
  offset += 4;
  const courseId = data.slice(offset, offset + courseIdLen).toString('utf8');
  offset += courseIdLen;

  const learner = new PublicKey(data.slice(offset, offset + 32));
  offset += 32;

  // Parse lesson flags (4 u64s for up to 256 lessons)
  const lessonFlags: BN[] = [];
  for (let i = 0; i < 4; i++) {
    lessonFlags.push(new BN(data.slice(offset, offset + 8), 'le'));
    offset += 8;
  }

  const enrolledAt = new BN(data.slice(offset, offset + 8), 'le');
  offset += 8;

  // Parse optional completedAt
  const hasCompletedAt = data[offset] === 1;
  offset += 1;
  let completedAt: BN | null = null;
  if (hasCompletedAt) {
    completedAt = new BN(data.slice(offset, offset + 8), 'le');
    offset += 8;
  }

  // Parse optional credentialAsset
  const hasCredential = data[offset] === 1;
  offset += 1;
  let credentialAsset: PublicKey | null = null;
  if (hasCredential) {
    credentialAsset = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
  }

  const bump = data[offset];
  offset += 1;

  const reserved = Array.from(data.slice(offset, offset + 4));

  return {
    courseId,
    learner,
    lessonFlags,
    enrolledAt,
    completedAt,
    credentialAsset,
    bump,
    reserved,
  };
}

/**
 * Count completed lessons from bitmap
 */
export function countCompletedLessons(lessonFlags: BN[]): number {
  let count = 0;
  for (const flag of lessonFlags) {
    // Count bits set in the BN
    let n = flag.clone();
    while (!n.isZero()) {
      count += n.and(new BN(1)).toNumber();
      n = n.shrn(1);
    }
  }
  return count;
}

/**
 * Check if a specific lesson is completed
 */
export function isLessonCompleted(lessonFlags: BN[], lessonIndex: number): boolean {
  const flagIndex = Math.floor(lessonIndex / 64);
  const bitIndex = lessonIndex % 64;

  if (flagIndex >= lessonFlags.length) return false;

  const flag = lessonFlags[flagIndex];
  return !flag.and(new BN(1).shln(bitIndex)).isZero();
}

/**
 * Get array of completed lesson indices
 * @param lessonFlags - Bitmap array from enrollment account
 * @param lessonCount - Total number of lessons in the course
 * @returns Array of completed lesson indices (0-based)
 */
export function getCompletedLessonIndices(lessonFlags: BN[], lessonCount: number): number[] {
  const completed: number[] = [];
  for (let i = 0; i < lessonCount; i++) {
    if (isLessonCompleted(lessonFlags, i)) {
      completed.push(i);
    }
  }
  return completed;
}

// Export utilities
export {
  PROGRAM_ID,
  XP_MINT,
  TOKEN_2022_PROGRAM_ID,
  MPL_CORE_PROGRAM_ID,
  TRACK_IDS,
  DIFFICULTY_LEVELS,
};
