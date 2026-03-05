import bs58 from "bs58";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { buildEnrollInstruction, SUPERTEAM_ACADEMY_PROGRAM_ID } from "@/lib/progress/onchain-enrollment";

const enrollmentSyncConnection = new Connection(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl("devnet"),
  "confirmed"
);

export interface EnrollmentTransactionVerificationInput {
  courseSlug: string;
  courseId: string;
  walletAddress: string;
  transactionSignature: string;
}

export interface EnrollmentTransactionVerificationResult {
  ok: boolean;
  error?: string;
}

export interface EnrollmentAccountVerificationInput {
  courseId: string;
  walletAddress: string;
}

export async function verifyEnrollmentTransaction(
  input: EnrollmentTransactionVerificationInput
): Promise<EnrollmentTransactionVerificationResult> {
  try {
    const learner = new PublicKey(input.walletAddress);
    const transaction = await enrollmentSyncConnection.getParsedTransaction(
      input.transactionSignature,
      {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      }
    );

    if (!transaction || transaction.meta?.err) {
      return { ok: false, error: "Transaction was not confirmed on devnet" };
    }

    const expectedInstruction = buildEnrollInstruction({
      courseId: input.courseId,
      learner,
    });
    const expectedAccounts = expectedInstruction.keys.map((key) =>
      key.pubkey.toBase58()
    );
    const expectedData = bs58.encode(Buffer.from(expectedInstruction.data));

    const matchingInstruction = transaction.transaction.message.instructions.find(
      (instruction) =>
        "programId" in instruction &&
        instruction.programId.equals(SUPERTEAM_ACADEMY_PROGRAM_ID) &&
        "data" in instruction &&
        instruction.data === expectedData &&
        instruction.accounts.map((account) => account.toBase58()).join(",") ===
          expectedAccounts.join(",")
    );

    if (!matchingInstruction) {
      return {
        ok: false,
        error: "Transaction did not match the expected academy enrollment instruction",
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Unable to verify enrollment transaction on devnet",
    };
  }
}

export async function verifyEnrollmentAccountExists(
  input: EnrollmentAccountVerificationInput
): Promise<EnrollmentTransactionVerificationResult> {
  try {
    const learner = new PublicKey(input.walletAddress);
    const expectedInstruction = buildEnrollInstruction({
      courseId: input.courseId,
      learner,
    });
    const enrollmentPda = expectedInstruction.keys[1]?.pubkey;

    if (!enrollmentPda) {
      return { ok: false, error: "Unable to derive enrollment account" };
    }

    const account = await enrollmentSyncConnection.getAccountInfo(enrollmentPda, "confirmed");
    if (!account) {
      return { ok: false, error: "Enrollment account does not exist on devnet" };
    }

    if (!account.owner.equals(SUPERTEAM_ACADEMY_PROGRAM_ID)) {
      return {
        ok: false,
        error: "Enrollment account owner does not match academy program",
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Unable to verify on-chain enrollment account on devnet",
    };
  }
}
