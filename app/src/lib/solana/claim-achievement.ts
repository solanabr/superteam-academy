import { PublicKey, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { PROGRAM_ID, AUTHORITY } from './constants';
import { achievementTypePda, achievementReceiptPda, configPda } from './pda';

/**
 * Anchor instruction discriminator for `claim_achievement`.
 * sha256("global:claim_achievement")[0..8]
 */
const CLAIM_ACHIEVEMENT_DISCRIMINATOR = Buffer.from([107, 181, 102, 247, 207, 212, 251, 24]);

/**
 * Builds the `claim_achievement` instruction for the Superteam Academy program.
 *
 * The recipient (learner) signs to claim an earned achievement on-chain,
 * creating an AchievementReceipt PDA.
 *
 * Instruction data layout (Borsh):
 *   [8 bytes discriminator] [4 bytes achievementId length (LE)] [N bytes achievementId UTF-8]
 *
 * Accounts:
 *   0. recipient        (signer, writable) — the learner claiming
 *   1. achievement_type (read)             — AchievementType PDA
 *   2. achievement_receipt (writable)      — AchievementReceipt PDA (created)
 *   3. config           (read)             — Config PDA
 *   4. authority         (read)             — Platform authority
 *   5. system_program   (read)             — System Program
 */
export function buildClaimAchievementInstruction(
  achievementId: string,
  recipient: PublicKey,
): TransactionInstruction {
  const [achievementType] = achievementTypePda(achievementId);
  const [achievementReceipt] = achievementReceiptPda(achievementId, recipient);
  const [config] = configPda();

  const keys = [
    { pubkey: recipient, isSigner: true, isWritable: true },
    { pubkey: achievementType, isSigner: false, isWritable: false },
    { pubkey: achievementReceipt, isSigner: false, isWritable: true },
    { pubkey: config, isSigner: false, isWritable: false },
    { pubkey: AUTHORITY, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  const achievementIdBuf = Buffer.from(achievementId, 'utf-8');
  const achievementIdLen = Buffer.alloc(4);
  achievementIdLen.writeUInt32LE(achievementIdBuf.length);
  const data = Buffer.concat([CLAIM_ACHIEVEMENT_DISCRIMINATOR, achievementIdLen, achievementIdBuf]);

  return new TransactionInstruction({ keys, programId: PROGRAM_ID, data });
}

/**
 * Returns the Solana Explorer URL for a given transaction signature.
 */
export function explorerTxUrl(signature: string, cluster: string): string {
  const base = 'https://explorer.solana.com/tx';
  if (cluster === 'mainnet-beta') {
    return `${base}/${signature}`;
  }
  return `${base}/${signature}?cluster=${cluster}`;
}
