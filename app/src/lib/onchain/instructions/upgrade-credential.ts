/**
 * Build the backend-signed `upgrade_credential` transaction.
 * Discriminator: sha256("global:upgrade_credential")[0:8] — computed at module load.
 *
 * Key difference from `issue_credential`:
 *  - credentialAsset is an EXISTING NFT address (isSigner: false, isWritable: true)
 *  - enrollment is read-only (isSigner: false, isWritable: false)
 *  - Only backendSigner needs to sign (no credentialAssetKeypair)
 */

import { createHash } from "crypto";
import {
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { PROGRAM_ID, MPL_CORE_PROGRAM_ID } from "../constants";
import { getConfigPda, getCoursePda, getEnrollmentPda } from "../pda";

const DISCRIMINATOR = Buffer.from(
  createHash("sha256").update("global:upgrade_credential").digest()
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

export interface UpgradeCredentialParams {
  courseId: string;
  learner: PublicKey;
  /** Existing credential NFT asset address (NOT a new keypair). */
  credentialAsset: PublicKey;
  trackCollection: PublicKey;
  name: string;
  uri: string;
  coursesCompleted: number; // u8
  totalXp: bigint;          // u64
  backendSigner: PublicKey;
  connection: Connection;
}

/**
 * Build a ready-to-sign `upgrade_credential` transaction.
 * Only backendSigner needs to sign — no credentialAsset signer required.
 */
export async function buildUpgradeCredentialTransaction(
  params: UpgradeCredentialParams,
): Promise<Transaction> {
  const {
    courseId, learner, credentialAsset, trackCollection, name, uri,
    coursesCompleted, totalXp, backendSigner, connection,
  } = params;

  const [configPda] = getConfigPda();
  const [coursePda] = getCoursePda(courseId);
  const [enrollmentPda] = getEnrollmentPda(courseId, learner);

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
      { pubkey: enrollmentPda, isSigner: false, isWritable: false },
      { pubkey: learner, isSigner: false, isWritable: false },
      { pubkey: credentialAsset, isSigner: false, isWritable: true },
      { pubkey: trackCollection, isSigner: false, isWritable: true },
      { pubkey: backendSigner, isSigner: true, isWritable: true },
      { pubkey: backendSigner, isSigner: true, isWritable: false },
      { pubkey: MPL_CORE_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  const tx = new Transaction({ feePayer: backendSigner, blockhash, lastValidBlockHeight });
  tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }));
  tx.add(ix);

  return tx;
}
