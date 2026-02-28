import { PublicKey, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { PROGRAM_ID } from './constants';
import { coursePda, enrollmentPda } from './pda';

/**
 * Anchor instruction discriminators — first 8 bytes of sha256("global:<instruction_name>").
 * Pre-computed at build time to avoid runtime crypto dependency.
 */
const ENROLL_DISCRIMINATOR = Buffer.from([58, 12, 36, 3, 142, 28, 1, 43]);
const CLOSE_ENROLLMENT_DISCRIMINATOR = Buffer.from([236, 137, 133, 253, 91, 138, 217, 91]);

/**
 * Builds the `enroll` instruction for the Superteam Academy program.
 *
 * The learner signs this transaction to create their Enrollment PDA.
 * If the course has a prerequisite, the prerequisite Course PDA and
 * the learner's completed prerequisite Enrollment PDA must be passed
 * as remaining accounts.
 *
 * Instruction data layout (Borsh):
 *   [8 bytes discriminator] [4 bytes courseId length (LE)] [N bytes courseId UTF-8]
 */
export function buildEnrollInstruction(
  courseId: string,
  learner: PublicKey,
  prerequisiteCourseId?: string,
): TransactionInstruction {
  const [course] = coursePda(courseId);
  const [enrollment] = enrollmentPda(courseId, learner);

  const keys = [
    { pubkey: course, isSigner: false, isWritable: false },
    { pubkey: enrollment, isSigner: false, isWritable: true },
    { pubkey: learner, isSigner: true, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  if (prerequisiteCourseId) {
    const [prereqCourse] = coursePda(prerequisiteCourseId);
    const [prereqEnrollment] = enrollmentPda(prerequisiteCourseId, learner);
    keys.push(
      { pubkey: prereqCourse, isSigner: false, isWritable: false },
      { pubkey: prereqEnrollment, isSigner: false, isWritable: false },
    );
  }

  const courseIdBuf = Buffer.from(courseId, 'utf-8');
  const courseIdLen = Buffer.alloc(4);
  courseIdLen.writeUInt32LE(courseIdBuf.length);
  const data = Buffer.concat([ENROLL_DISCRIMINATOR, courseIdLen, courseIdBuf]);

  return new TransactionInstruction({ keys, programId: PROGRAM_ID, data });
}

/**
 * Builds the `close_enrollment` instruction for the Superteam Academy program.
 *
 * The learner signs this transaction to close their Enrollment PDA and
 * reclaim rent. Completed courses close immediately; incomplete courses
 * require 24h after enrollment.
 *
 * Instruction data layout (Borsh):
 *   [8 bytes discriminator]
 *
 * No additional instruction arguments — the enrollment is identified by
 * the Course + Enrollment PDAs passed as accounts.
 */
export function buildCloseEnrollmentInstruction(
  courseId: string,
  learner: PublicKey,
): TransactionInstruction {
  const [course] = coursePda(courseId);
  const [enrollment] = enrollmentPda(courseId, learner);

  const keys = [
    { pubkey: course, isSigner: false, isWritable: false },
    { pubkey: enrollment, isSigner: false, isWritable: true },
    { pubkey: learner, isSigner: true, isWritable: true },
  ];

  const data = Buffer.from(CLOSE_ENROLLMENT_DISCRIMINATOR);

  return new TransactionInstruction({ keys, programId: PROGRAM_ID, data });
}
