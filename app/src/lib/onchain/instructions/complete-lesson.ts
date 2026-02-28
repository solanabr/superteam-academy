/**
 * Build the backend-signed `complete_lesson` transaction.
 */

import { createHash } from "crypto";
import {
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "../constants";
import { getConfigPda, getCoursePda, getEnrollmentPda } from "../pda";
import { deserializeConfig } from "../deserializers";

const DISCRIMINATOR = Buffer.from(
  createHash("sha256").update("global:complete_lesson").digest(),
).subarray(0, 8);

/**
 * Build a ready-to-sign `complete_lesson` transaction.
 * The backend signer is the fee payer and must sign before sending.
 *
 * @param courseId     Course slug (for PDA derivation only — NOT in instruction data)
 * @param learner      Learner wallet public key
 * @param lessonIndex  0-based lesson index (encoded as u8)
 * @param backendSigner Backend signer public key (fee payer)
 * @param connection   Solana RPC connection
 */
export async function buildCompleteLessonTransaction(
  courseId: string,
  learner: PublicKey,
  lessonIndex: number,
  backendSigner: PublicKey,
  connection: Connection,
): Promise<Transaction> {
  const [configPda] = getConfigPda();
  const [coursePda] = getCoursePda(courseId);
  const [enrollmentPda] = getEnrollmentPda(courseId, learner);

  const configInfo = await connection.getAccountInfo(configPda);
  if (!configInfo) throw new Error("Config account not found");
  const { xpMint } = deserializeConfig(Buffer.from(configInfo.data));

  const learnerXpAta = getAssociatedTokenAddressSync(
    xpMint,
    learner,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  // Instruction data: discriminator (8 bytes) + lessonIndex u8 (1 byte)
  const data = Buffer.concat([
    DISCRIMINATOR,
    Buffer.from([lessonIndex & 0xff]),
  ]);

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: configPda, isSigner: false, isWritable: false },
      { pubkey: coursePda, isSigner: false, isWritable: false },
      { pubkey: enrollmentPda, isSigner: false, isWritable: true },
      { pubkey: learner, isSigner: false, isWritable: false },
      { pubkey: learnerXpAta, isSigner: false, isWritable: true },
      { pubkey: xpMint, isSigner: false, isWritable: true },
      { pubkey: backendSigner, isSigner: true, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data,
  });

  const [ataInfo, { blockhash, lastValidBlockHeight }] = await Promise.all([
    connection.getAccountInfo(learnerXpAta),
    connection.getLatestBlockhash(),
  ]);

  const tx = new Transaction({
    feePayer: backendSigner,
    blockhash,
    lastValidBlockHeight,
  });
  tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 60_000 }));

  if (!ataInfo) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        backendSigner,
        learnerXpAta,
        learner,
        xpMint,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      ),
    );
  }

  tx.add(ix);
  return tx;
}
