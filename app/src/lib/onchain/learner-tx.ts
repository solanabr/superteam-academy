import { Buffer } from "buffer";
import {
  type AccountMeta,
  type Connection,
  PublicKey,
  type SendOptions,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { ACADEMY_PROGRAM_ID } from "@/lib/onchain/constants";
import { deriveCoursePda, deriveEnrollmentPda } from "@/lib/onchain/pdas";

const ENROLL_DISCRIMINATOR = Uint8Array.from([58, 12, 36, 3, 142, 28, 1, 43]);
const CLOSE_ENROLLMENT_DISCRIMINATOR = Uint8Array.from([
  236, 137, 133, 253, 91, 138, 217, 91,
]);

export type WalletSendTransaction = (
  transaction: Transaction,
  connection: Connection,
  options?: SendOptions
) => Promise<string>;

class LearnerTxError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function encodeAnchorString(value: string): Uint8Array {
  const encoded = new TextEncoder().encode(value);
  const out = new Uint8Array(4 + encoded.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, encoded.length, true);
  out.set(encoded, 4);
  return out;
}

function concatBytes(...parts: Uint8Array[]): Buffer {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return Buffer.from(out);
}

async function submitLearnerSignedTx(params: {
  connection: Connection;
  learner: PublicKey;
  sendTransaction: WalletSendTransaction;
  instruction: TransactionInstruction;
}): Promise<string> {
  const latest = await params.connection.getLatestBlockhash("confirmed");
  const tx = new Transaction({
    feePayer: params.learner,
    blockhash: latest.blockhash,
    lastValidBlockHeight: latest.lastValidBlockHeight,
  }).add(params.instruction);

  const signature = await params.sendTransaction(tx, params.connection, {
    preflightCommitment: "confirmed",
    maxRetries: 3,
    skipPreflight: false,
  });

  const confirmation = await params.connection.confirmTransaction(
    signature,
    "confirmed"
  );
  if (confirmation.value.err) {
    throw new LearnerTxError(
      "TX_CONFIRMATION_FAILED",
      `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
    );
  }

  return signature;
}

export interface LearnerSubmissionResult {
  signature: string;
  accountHints: Record<string, string>;
}

export async function submitEnrollTx(params: {
  courseId: string;
  learner: PublicKey;
  connection: Connection;
  sendTransaction: WalletSendTransaction;
  prerequisite?: {
    course: PublicKey;
    enrollment: PublicKey;
  };
}): Promise<LearnerSubmissionResult> {
  const [coursePda] = deriveCoursePda(params.courseId);
  const [enrollmentPda] = deriveEnrollmentPda(params.learner, params.courseId);

  const keys: AccountMeta[] = [
    { pubkey: coursePda, isSigner: false, isWritable: true },
    { pubkey: enrollmentPda, isSigner: false, isWritable: true },
    { pubkey: params.learner, isSigner: true, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  if (params.prerequisite) {
    keys.push(
      {
        pubkey: params.prerequisite.course,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: params.prerequisite.enrollment,
        isSigner: false,
        isWritable: false,
      }
    );
  }

  const ix = new TransactionInstruction({
    programId: ACADEMY_PROGRAM_ID,
    keys,
    data: concatBytes(
      ENROLL_DISCRIMINATOR,
      encodeAnchorString(params.courseId)
    ),
  });

  const signature = await submitLearnerSignedTx({
    connection: params.connection,
    learner: params.learner,
    sendTransaction: params.sendTransaction,
    instruction: ix,
  });

  return {
    signature,
    accountHints: {
      course: coursePda.toBase58(),
      enrollment: enrollmentPda.toBase58(),
      learner: params.learner.toBase58(),
      systemProgram: SystemProgram.programId.toBase58(),
      ...(params.prerequisite
        ? {
            prerequisiteCourse: params.prerequisite.course.toBase58(),
            prerequisiteEnrollment: params.prerequisite.enrollment.toBase58(),
          }
        : {}),
    },
  };
}

export async function submitCloseEnrollmentTx(params: {
  courseId: string;
  learner: PublicKey;
  connection: Connection;
  sendTransaction: WalletSendTransaction;
}): Promise<LearnerSubmissionResult> {
  const [coursePda] = deriveCoursePda(params.courseId);
  const [enrollmentPda] = deriveEnrollmentPda(params.learner, params.courseId);

  const ix = new TransactionInstruction({
    programId: ACADEMY_PROGRAM_ID,
    keys: [
      { pubkey: coursePda, isSigner: false, isWritable: false },
      { pubkey: enrollmentPda, isSigner: false, isWritable: true },
      { pubkey: params.learner, isSigner: true, isWritable: true },
    ],
    data: concatBytes(CLOSE_ENROLLMENT_DISCRIMINATOR),
  });

  const signature = await submitLearnerSignedTx({
    connection: params.connection,
    learner: params.learner,
    sendTransaction: params.sendTransaction,
    instruction: ix,
  });

  return {
    signature,
    accountHints: {
      course: coursePda.toBase58(),
      enrollment: enrollmentPda.toBase58(),
      learner: params.learner.toBase58(),
    },
  };
}

