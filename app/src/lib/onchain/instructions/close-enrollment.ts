/**
 * Build the learner-signed `close_enrollment` transaction.
 * Closes the Enrollment PDA and returns the rent lamports to the learner.
 */

import { createHash } from "crypto";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { PROGRAM_ID } from "../constants";
import { getCoursePda, getEnrollmentPda } from "../pda";

const DISCRIMINATOR = Buffer.from(
  createHash("sha256").update("global:close_enrollment").digest()
).subarray(0, 8);

/**
 * Build a ready-to-sign `close_enrollment` transaction.
 * The learner is the fee payer and must sign.
 *
 * @param courseId   Course slug
 * @param learner    Learner wallet public key (signer, receives rent)
 * @param connection Solana RPC connection
 */
export async function buildCloseEnrollmentTransaction(
  courseId: string,
  learner: PublicKey,
  connection: Connection,
): Promise<Transaction> {
  const [coursePda] = getCoursePda(courseId);
  const [enrollmentPda] = getEnrollmentPda(courseId, learner);

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: coursePda, isSigner: false, isWritable: false },
      { pubkey: enrollmentPda, isSigner: false, isWritable: true },
      { pubkey: learner, isSigner: true, isWritable: true },
    ],
    data: DISCRIMINATOR,
  });

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  const tx = new Transaction({ feePayer: learner, blockhash, lastValidBlockHeight });
  tx.add(ix);
  return tx;
}
