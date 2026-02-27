/**
 * PDA Derivation Utilities for Superteam Academy Program
 * Based on the on-chain program seeds
 */
import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from './program-config';

/**
 * Derives the Config PDA
 * Seeds: ["config"]
 */
export function deriveConfigPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('config')], PROGRAM_ID);
}

/**
 * Derives a Course PDA
 * Seeds: ["course", course_id.as_bytes()]
 */
export function deriveCoursePda(courseId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('course'), Buffer.from(courseId)],
    PROGRAM_ID
  );
}

/**
 * Derives an Enrollment PDA
 * Seeds: ["enrollment", course_id.as_bytes(), user.key()]
 */
export function deriveEnrollmentPda(courseId: string, learner: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('enrollment'), Buffer.from(courseId), learner.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Derives a MinterRole PDA
 * Seeds: ["minter", minter.key()]
 */
export function deriveMinterRolePda(minter: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('minter'), minter.toBuffer()], PROGRAM_ID);
}

/**
 * Derives an AchievementType PDA
 * Seeds: ["achievement", achievement_id.as_bytes()]
 */
export function deriveAchievementTypePda(achievementId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('achievement'), Buffer.from(achievementId)],
    PROGRAM_ID
  );
}

/**
 * Derives an AchievementReceipt PDA
 * Seeds: ["achievement_receipt", achievement_id.as_bytes(), recipient.key()]
 */
export function deriveAchievementReceiptPda(
  achievementId: string,
  recipient: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('achievement_receipt'), Buffer.from(achievementId), recipient.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Derives the Associated Token Account for XP (Token-2022)
 */
export function deriveXpTokenAccount(wallet: PublicKey, xpMint: PublicKey): PublicKey {
  const [ata] = PublicKey.findProgramAddressSync(
    [wallet.toBuffer(), TOKEN_2022_PROGRAM_ID.toBuffer(), xpMint.toBuffer()],
    new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL') // Associated Token Program
  );
  return ata;
}

/**
 * Helper to check if a PDA exists by checking account info
 */
export async function pdaExists(
  connection: { getAccountInfo: (key: PublicKey) => Promise<{ data: Buffer } | null> },
  pda: PublicKey
): Promise<boolean> {
  const accountInfo = await connection.getAccountInfo(pda);
  return accountInfo !== null;
}

/**
 * Batch derive multiple enrollment PDAs
 */
export function deriveEnrollmentPdas(
  courseIds: string[],
  learner: PublicKey
): Map<string, [PublicKey, number]> {
  const pdas = new Map<string, [PublicKey, number]>();
  for (const courseId of courseIds) {
    pdas.set(courseId, deriveEnrollmentPda(courseId, learner));
  }
  return pdas;
}

/**
 * Batch derive course PDAs
 */
export function deriveCoursePdas(courseIds: string[]): Map<string, [PublicKey, number]> {
  const pdas = new Map<string, [PublicKey, number]>();
  for (const courseId of courseIds) {
    pdas.set(courseId, deriveCoursePda(courseId));
  }
  return pdas;
}

// Export all derivation functions
export const pda = {
  config: deriveConfigPda,
  course: deriveCoursePda,
  enrollment: deriveEnrollmentPda,
  minterRole: deriveMinterRolePda,
  achievementType: deriveAchievementTypePda,
  achievementReceipt: deriveAchievementReceiptPda,
  xpTokenAccount: deriveXpTokenAccount,
};
