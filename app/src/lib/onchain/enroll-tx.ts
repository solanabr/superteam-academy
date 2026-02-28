/**
 * Build the on-chain `enroll` transaction for a learner to sign directly.
 * The learner pays rent for the Enrollment PDA — no backend needed.
 *
 * Instruction discriminator: sha256("global:enroll")[0:8] = [58,12,36,3,142,28,1,43]
 */

import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { PROGRAM_ID } from "./constants";
import { getCoursePda, getEnrollmentPda } from "./pda";

// Anchor discriminator for `enroll` = sha256("global:enroll")[0:8]
const ENROLL_DISCRIMINATOR = Buffer.from([58, 12, 36, 3, 142, 28, 1, 43]);

/** Borsh-encode a string: 4-byte LE u32 length prefix + UTF-8 bytes. */
function encodeString(s: string): Buffer {
  const bytes = Buffer.from(s, "utf8");
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32LE(bytes.length, 0);
  return Buffer.concat([len, bytes]);
}

/**
 * Build a ready-to-sign `enroll` transaction.
 * @param courseId  Course slug as stored on-chain (e.g. "intro-to-solana")
 * @param learner   Learner's wallet public key (will be the fee payer + signer)
 * @param connection  Solana RPC connection (needed for blockhash)
 */
export async function buildEnrollTransaction(
  courseId: string,
  learner: PublicKey,
  connection: Connection,
): Promise<Transaction> {
  // Instruction data: discriminator + borsh-encoded courseId string
  const data = Buffer.concat([ENROLL_DISCRIMINATOR, encodeString(courseId)]);

  const [coursePda] = getCoursePda(courseId);
  const [enrollmentPda] = getEnrollmentPda(courseId, learner);

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: coursePda, isSigner: false, isWritable: true },
      { pubkey: enrollmentPda, isSigner: false, isWritable: true },
      { pubkey: learner, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  const tx = new Transaction({ feePayer: learner, blockhash, lastValidBlockHeight });
  tx.add(ix);
  return tx;
}

/** Check whether an enrollment PDA exists on-chain (learner is already enrolled). */
export async function isEnrolledOnChain(
  courseId: string,
  learner: PublicKey,
  connection: Connection,
): Promise<boolean> {
  const [enrollmentPda] = getEnrollmentPda(courseId, learner);
  const info = await connection.getAccountInfo(enrollmentPda);
  return info !== null;
}
