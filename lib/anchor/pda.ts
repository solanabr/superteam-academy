import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID, PDA_SEEDS } from './constants';

/**
 * PDA Derivation utilities for the On-chain Academy program
 */

/**
 * Derives the Config PDA (singleton)
 */
export function getConfigPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEEDS.CONFIG)],
    PROGRAM_ID
  );
}

/**
 * Derives a Course PDA
 */
export function getCoursePda(courseId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEEDS.COURSE), Buffer.from(courseId)],
    PROGRAM_ID
  );
}

/**
 * Derives an Enrollment PDA
 */
export function getEnrollmentPda(courseId: string, learner: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEEDS.ENROLLMENT), Buffer.from(courseId), learner.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Derives a MinterRole PDA
 */
export function getMinterRolePda(minter: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEEDS.MINTER), minter.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Derives an AchievementType PDA
 */
export function getAchievementTypePda(achievementId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PDA_SEEDS.ACHIEVEMENT), Buffer.from(achievementId)],
    PROGRAM_ID
  );
}

/**
 * Derives an AchievementReceipt PDA
 */
export function getAchievementReceiptPda(achievementId: string, recipient: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(PDA_SEEDS.ACHIEVEMENT_RECEIPT),
      Buffer.from(achievementId),
      recipient.toBuffer(),
    ],
    PROGRAM_ID
  );
}
