/**
 * Build the backend-signed `issue_credential` transaction.
 * Two signers required:
 *  1. backendSigner — fee payer and authority
 *  2. credentialAssetKeypair — freshly generated keypair that becomes the NFT address
 */

import { createHash } from "crypto";
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { PROGRAM_ID, MPL_CORE_PROGRAM_ID } from "../constants";
import { getConfigPda, getCoursePda, getEnrollmentPda } from "../pda";

const DISCRIMINATOR = Buffer.from(
  createHash("sha256").update("global:issue_credential").digest(),
).subarray(0, 8);

function encodeString(s: string): Buffer {
  const bytes = Buffer.from(s, "utf8");
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32LE(bytes.length, 0);
  return Buffer.concat([len, bytes]);
}

function encodeU8(n: number): Buffer {
  const b = Buffer.allocUnsafe(1);
  b.writeUInt8(n, 0);
  return b;
}

function encodeU64LE(n: bigint): Buffer {
  const b = Buffer.allocUnsafe(8);
  b.writeBigUInt64LE(n, 0);
  return b;
}

export interface IssueCredentialParams {
  courseId: string;
  learner: PublicKey;
  trackCollection: PublicKey;
  name: string;
  uri: string;
  coursesCompleted: number; // u8
  totalXp: bigint; // u64
  backendSigner: PublicKey;
  connection: Connection;
}

export interface IssueCredentialResult {
  transaction: Transaction;
  credentialAssetKeypair: Keypair;
}

/**
 * Build a ready-to-sign `issue_credential` transaction.
 * The caller must sign with both backendSigner and credentialAssetKeypair.
 */
export async function buildIssueCredentialTransaction(
  params: IssueCredentialParams,
): Promise<IssueCredentialResult> {
  const {
    courseId,
    learner,
    trackCollection,
    name,
    uri,
    coursesCompleted,
    totalXp,
    backendSigner,
    connection,
  } = params;

  const [configPda] = getConfigPda();
  const [coursePda] = getCoursePda(courseId);
  const [enrollmentPda] = getEnrollmentPda(courseId, learner);

  const credentialAssetKeypair = Keypair.generate();

  // Instruction data: discriminator + name + uri + coursesCompleted + totalXp
  const data = Buffer.concat([
    DISCRIMINATOR,
    encodeString(name),
    encodeString(uri),
    encodeU8(coursesCompleted),
    encodeU64LE(totalXp),
  ]);

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: configPda, isSigner: false, isWritable: false },
      { pubkey: coursePda, isSigner: false, isWritable: false },
      { pubkey: enrollmentPda, isSigner: false, isWritable: true },
      { pubkey: learner, isSigner: false, isWritable: false },
      {
        pubkey: credentialAssetKeypair.publicKey,
        isSigner: true,
        isWritable: true,
      },
      { pubkey: trackCollection, isSigner: false, isWritable: true },
      { pubkey: backendSigner, isSigner: true, isWritable: true },
      { pubkey: backendSigner, isSigner: true, isWritable: false },
      { pubkey: MPL_CORE_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();
  const tx = new Transaction({
    feePayer: backendSigner,
    blockhash,
    lastValidBlockHeight,
  });
  // Metaplex Core createV2 + plugin init can reach 200K CU; set explicit budget.
  tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }));
  tx.add(ix);

  return { transaction: tx, credentialAssetKeypair };
}
