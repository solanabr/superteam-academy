/**
 * Build the backend-signed `finalize_course` transaction.
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
import { deserializeConfig, readCreatorFromCourse } from "../deserializers";

const DISCRIMINATOR = Buffer.from(
  createHash("sha256").update("global:finalize_course").digest()
).subarray(0, 8);

/**
 * Build a ready-to-sign `finalize_course` transaction.
 * The backend signer is the fee payer and must sign before sending.
 *
 * @param courseId     Course slug
 * @param learner      Learner wallet public key
 * @param backendSigner Backend signer public key (fee payer)
 * @param connection   Solana RPC connection
 */
export async function buildFinalizeCourseTransaction(
  courseId: string,
  learner: PublicKey,
  backendSigner: PublicKey,
  connection: Connection,
): Promise<Transaction> {
  const [configPda] = getConfigPda();
  const [coursePda] = getCoursePda(courseId);
  const [enrollmentPda] = getEnrollmentPda(courseId, learner);

  const [configInfo, courseInfo] = await Promise.all([
    connection.getAccountInfo(configPda),
    connection.getAccountInfo(coursePda),
  ]);
  if (!configInfo) throw new Error("Config account not found");
  if (!courseInfo) throw new Error("Course account not found");

  const { xpMint } = deserializeConfig(Buffer.from(configInfo.data));
  const creator = readCreatorFromCourse(Buffer.from(courseInfo.data));

  const learnerXpAta = getAssociatedTokenAddressSync(
    xpMint,
    learner,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  const creatorXpAta = getAssociatedTokenAddressSync(
    xpMint,
    creator,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: configPda, isSigner: false, isWritable: false },
      { pubkey: coursePda, isSigner: false, isWritable: true },
      { pubkey: enrollmentPda, isSigner: false, isWritable: true },
      { pubkey: learner, isSigner: false, isWritable: false },
      { pubkey: learnerXpAta, isSigner: false, isWritable: true },
      { pubkey: creatorXpAta, isSigner: false, isWritable: true },
      { pubkey: creator, isSigner: false, isWritable: false },
      { pubkey: xpMint, isSigner: false, isWritable: true },
      { pubkey: backendSigner, isSigner: true, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: DISCRIMINATOR,
  });

  const [learnerAtaInfo, creatorAtaInfo, { blockhash, lastValidBlockHeight }] = await Promise.all([
    connection.getAccountInfo(learnerXpAta),
    connection.getAccountInfo(creatorXpAta),
    connection.getLatestBlockhash(),
  ]);

  const tx = new Transaction({ feePayer: backendSigner, blockhash, lastValidBlockHeight });
  tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 100_000 }));

  if (!learnerAtaInfo) {
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

  if (!creatorAtaInfo) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        backendSigner,
        creatorXpAta,
        creator,
        xpMint,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      ),
    );
  }

  tx.add(ix);
  return tx;
}
