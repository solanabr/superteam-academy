import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from './constants';

/**
 * Derives the singleton Config PDA.
 * Seeds: ["config"]
 */
export function configPda(programId: PublicKey = PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('config')], programId);
}

/**
 * Derives a Course PDA for a given course ID.
 * Seeds: ["course", course_id.as_bytes()]
 */
export function coursePda(
  courseId: string,
  programId: PublicKey = PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('course'), Buffer.from(courseId)],
    programId,
  );
}

/**
 * Derives an Enrollment PDA for a learner in a specific course.
 * Seeds: ["enrollment", course_id.as_bytes(), learner.key()]
 */
export function enrollmentPda(
  courseId: string,
  learner: PublicKey,
  programId: PublicKey = PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('enrollment'), Buffer.from(courseId), learner.toBuffer()],
    programId,
  );
}

/**
 * Derives a MinterRole PDA for a given minter pubkey.
 * Seeds: ["minter", minter.key()]
 */
export function minterRolePda(
  minter: PublicKey,
  programId: PublicKey = PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('minter'), minter.toBuffer()],
    programId,
  );
}

/**
 * Derives an AchievementType PDA for a given achievement ID.
 * Seeds: ["achievement", achievement_id.as_bytes()]
 */
export function achievementTypePda(
  achievementId: string,
  programId: PublicKey = PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('achievement'), Buffer.from(achievementId)],
    programId,
  );
}

/**
 * Derives an AchievementReceipt PDA for a recipient of a specific achievement.
 * Seeds: ["achievement_receipt", achievement_id.as_bytes(), recipient.key()]
 */
export function achievementReceiptPda(
  achievementId: string,
  recipient: PublicKey,
  programId: PublicKey = PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('achievement_receipt'), Buffer.from(achievementId), recipient.toBuffer()],
    programId,
  );
}
