import { PublicKey } from '@solana/web3.js';
import { PDA_SEEDS, PROGRAM_ID } from './constants';

/**
 * Get the Config PDA (global program configuration)
 */
export function getConfigPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEEDS.CONFIG)],
    PROGRAM_ID
  );
}

/**
 * Get a Course PDA by course ID
 */
export function getCoursePda(courseId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEEDS.COURSE), Buffer.from(courseId)],
    PROGRAM_ID
  );
}

/**
 * Get an Enrollment PDA by course ID and learner
 */
export function getEnrollmentPda(courseId: string, learnerAddress: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEEDS.ENROLLMENT), Buffer.from(courseId), learnerAddress.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Get a Minter Role PDA
 */
export function getMinterRolePda(minterAddress: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEEDS.MINTER_ROLE), minterAddress.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Get an Achievement Type PDA
 */
export function getAchievementTypePda(achievementId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEEDS.ACHIEVEMENT_TYPE), Buffer.from(achievementId)],
    PROGRAM_ID
  );
}

/**
 * Get an Achievement Receipt PDA
 */
export function getAchievementReceiptPda(achievementId: string, recipientAddress: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEEDS.ACHIEVEMENT_RECEIPT), Buffer.from(achievementId), recipientAddress.toBuffer()],
    PROGRAM_ID
  );
}
