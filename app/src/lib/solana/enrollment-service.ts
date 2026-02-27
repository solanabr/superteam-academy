/**
 * Enrollment Service
 * Handles course enrollment and unenrollment via wallet signing
 */
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from '@solana/web3.js';
import { PROGRAM_ID } from './program-config';
import { deriveConfigPda, deriveCoursePda, deriveEnrollmentPda } from './pda';
import {
  getConnection,
  fetchCourse,
  fetchEnrollment,
  fetchLearnerEnrollments,
} from './program-client';
import type { EnrollmentWithProgress, CourseWithMetadata } from './idl-types';

// ==================== Instruction Discriminators ====================

// These are the 8-byte Anchor instruction discriminators
// In production, these should be generated from the IDL
const INSTRUCTION_DISCRIMINATORS = {
  enroll: Buffer.from([0x09, 0x16, 0x38, 0x3d, 0x6b, 0xf9, 0x90, 0x02]),
  closeEnrollment: Buffer.from([0x6b, 0x2e, 0x89, 0x1a, 0xc4, 0xf5, 0x32, 0x11]),
};

// ==================== Enrollment Functions ====================

export interface EnrollmentResult {
  success: boolean;
  signature?: string;
  error?: string;
  enrollmentPda?: PublicKey;
}

/**
 * Create enrollment instruction
 */
function createEnrollInstruction(
  courseId: string,
  learner: PublicKey,
  coursePda: PublicKey,
  enrollmentPda: PublicKey,
  prerequisiteCourseId?: string
): TransactionInstruction {
  const keys = [
    { pubkey: coursePda, isSigner: false, isWritable: false },
    { pubkey: enrollmentPda, isSigner: false, isWritable: true },
    { pubkey: learner, isSigner: true, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  // Add prerequisite accounts if needed
  if (prerequisiteCourseId) {
    const [prereqCoursePda] = deriveCoursePda(prerequisiteCourseId);
    const [prereqEnrollmentPda] = deriveEnrollmentPda(prerequisiteCourseId, learner);

    keys.push(
      { pubkey: prereqCoursePda, isSigner: false, isWritable: false },
      { pubkey: prereqEnrollmentPda, isSigner: false, isWritable: false }
    );
  }

  // Encode course ID as Borsh string (4-byte length prefix + bytes)
  const courseIdBytes = Buffer.from(courseId, 'utf8');
  const courseIdLenBuffer = Buffer.alloc(4);
  courseIdLenBuffer.writeUInt32LE(courseIdBytes.length);

  const data = Buffer.concat([INSTRUCTION_DISCRIMINATORS.enroll, courseIdLenBuffer, courseIdBytes]);

  return new TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data,
  });
}

/**
 * Create close enrollment instruction
 */
function createCloseEnrollmentInstruction(
  learner: PublicKey,
  coursePda: PublicKey,
  enrollmentPda: PublicKey
): TransactionInstruction {
  const keys = [
    { pubkey: coursePda, isSigner: false, isWritable: false },
    { pubkey: enrollmentPda, isSigner: false, isWritable: true },
    { pubkey: learner, isSigner: true, isWritable: true },
  ];

  return new TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data: INSTRUCTION_DISCRIMINATORS.closeEnrollment,
  });
}

/**
 * Build enrollment transaction for wallet signing
 */
export async function buildEnrollTransaction(
  courseId: string,
  learner: PublicKey
): Promise<{ transaction: Transaction; enrollmentPda: PublicKey }> {
  const connection = getConnection();

  // Fetch course to check prerequisite
  const course = await fetchCourse(courseId);
  if (!course) {
    throw new Error(`Course not found: ${courseId}`);
  }

  if (!course.isActive) {
    throw new Error('Course is not active');
  }

  // Check if already enrolled
  const existingEnrollment = await fetchEnrollment(courseId, learner);
  if (existingEnrollment) {
    throw new Error('Already enrolled in this course');
  }

  // Derive PDAs
  const [coursePda] = deriveCoursePda(courseId);
  const [enrollmentPda] = deriveEnrollmentPda(courseId, learner);

  // Check prerequisite if exists
  let prerequisiteCourseId: string | undefined;
  if (course.prerequisite) {
    const prereqEnrollment = await fetchEnrollment(course.prerequisite, learner);
    if (!prereqEnrollment || !prereqEnrollment.isCompleted) {
      throw new Error(`Prerequisite not met: ${course.prerequisite}`);
    }
    prerequisiteCourseId = course.prerequisite;
  }

  // Create instruction
  const instruction = createEnrollInstruction(
    courseId,
    learner,
    coursePda,
    enrollmentPda,
    prerequisiteCourseId
  );

  // Build transaction
  const transaction = new Transaction().add(instruction);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = learner;

  return { transaction, enrollmentPda };
}

/**
 * Build close enrollment transaction for wallet signing
 */
export async function buildCloseEnrollmentTransaction(
  courseId: string,
  learner: PublicKey
): Promise<Transaction> {
  const connection = getConnection();

  // Check enrollment exists
  const enrollment = await fetchEnrollment(courseId, learner);
  if (!enrollment) {
    throw new Error('Not enrolled in this course');
  }

  // Check 24h cooldown for incomplete courses
  if (!enrollment.isCompleted) {
    const enrolledAtMs = enrollment.enrolledAt.toNumber() * 1000;
    const cooldownMs = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();

    if (now - enrolledAtMs < cooldownMs) {
      const hoursRemaining = Math.ceil((cooldownMs - (now - enrolledAtMs)) / (60 * 60 * 1000));
      throw new Error(`Cannot unenroll yet. ${hoursRemaining} hours remaining in cooldown.`);
    }
  }

  // Derive PDAs
  const [coursePda] = deriveCoursePda(courseId);
  const [enrollmentPda] = deriveEnrollmentPda(courseId, learner);

  // Create instruction
  const instruction = createCloseEnrollmentInstruction(learner, coursePda, enrollmentPda);

  // Build transaction
  const transaction = new Transaction().add(instruction);
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = learner;

  return transaction;
}

/**
 * Check if a wallet is enrolled in a course
 */
export async function isEnrolled(courseId: string, learner: PublicKey): Promise<boolean> {
  const enrollment = await fetchEnrollment(courseId, learner);
  return enrollment !== null;
}

/**
 * Get enrollment status for a course
 */
export interface EnrollmentStatus {
  isEnrolled: boolean;
  enrollment: EnrollmentWithProgress | null;
  canEnroll: boolean;
  canUnenroll: boolean;
  prerequisiteMet: boolean;
  unenrollCooldownHours?: number;
}

export async function getEnrollmentStatus(
  courseId: string,
  learner: PublicKey
): Promise<EnrollmentStatus> {
  const [course, enrollment] = await Promise.all([
    fetchCourse(courseId),
    fetchEnrollment(courseId, learner),
  ]);

  if (!course) {
    return {
      isEnrolled: false,
      enrollment: null,
      canEnroll: false,
      canUnenroll: false,
      prerequisiteMet: false,
    };
  }

  // Check prerequisite
  let prerequisiteMet = true;
  if (course.prerequisite) {
    const prereqEnrollment = await fetchEnrollment(course.prerequisite, learner);
    prerequisiteMet = prereqEnrollment?.isCompleted ?? false;
  }

  // Calculate unenroll cooldown
  let canUnenroll = false;
  let unenrollCooldownHours: number | undefined;

  if (enrollment) {
    if (enrollment.isCompleted) {
      canUnenroll = true;
    } else {
      const enrolledAtMs = enrollment.enrolledAt.toNumber() * 1000;
      const cooldownMs = 24 * 60 * 60 * 1000;
      const elapsed = Date.now() - enrolledAtMs;

      if (elapsed >= cooldownMs) {
        canUnenroll = true;
      } else {
        unenrollCooldownHours = Math.ceil((cooldownMs - elapsed) / (60 * 60 * 1000));
      }
    }
  }

  return {
    isEnrolled: enrollment !== null,
    enrollment,
    canEnroll: !enrollment && course.isActive && prerequisiteMet,
    canUnenroll,
    prerequisiteMet,
    unenrollCooldownHours,
  };
}

/**
 * Get all enrollments for a learner with course details
 */
export async function getLearnerCoursesWithProgress(learner: PublicKey): Promise<
  Array<{
    course: CourseWithMetadata;
    enrollment: EnrollmentWithProgress;
  }>
> {
  const enrollments = await fetchLearnerEnrollments(learner);

  const results = await Promise.all(
    enrollments.map(async (enrollment) => {
      const course = await fetchCourse(enrollment.courseId);
      if (!course) return null;
      return { course, enrollment };
    })
  );

  return results.filter((r): r is NonNullable<typeof r> => r !== null);
}

// Re-export for convenience
export { fetchEnrollment, fetchLearnerEnrollments };
