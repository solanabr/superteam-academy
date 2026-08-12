import "server-only";

import {
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { getBackendSigner, getConnection } from "./academy-program";
import { fetchEnrollment } from "./academy-reads";
import { buildEnrollInstruction } from "./instructions";
import { getProgramId } from "./pda";

export interface CustodialEnrollResult {
  /** Confirmed signature, or null when the enrolment already existed. */
  signature: string | null;
  alreadyEnrolled: boolean;
}

/**
 * Custodial `enroll` (Academy Wallet).
 *
 * Unlike the sponsored flow (sponsor-enroll.ts), which hands a partially
 * signed transaction back for the learner's own wallet to co-sign, here the
 * server holds BOTH signers: the backend sponsor pays fee + rent, and the
 * derived custodial keypair provides the learner signature the program
 * requires. The whole transaction is built, signed, and confirmed server-side
 * from two validated inputs — the caller can never inject instructions, so
 * neither funded key can be made to sign anything but this `enroll`.
 *
 * Idempotent: an existing Enrollment PDA short-circuits to success instead of
 * burning a transaction that would revert with AccountAlreadyInUse.
 */
export async function sendCustodialEnroll(
  courseId: string,
  learner: Keypair
): Promise<CustodialEnrollResult> {
  const connection = getConnection();
  const programId = getProgramId();

  const existing = await fetchEnrollment(
    courseId,
    learner.publicKey,
    connection,
    programId
  );
  if (existing) return { signature: null, alreadyEnrolled: true };

  const sponsor = getBackendSigner();
  const instruction = buildEnrollInstruction(
    courseId,
    learner.publicKey,
    programId,
    sponsor.publicKey
  );

  const transaction = new Transaction().add(instruction);
  transaction.feePayer = sponsor.publicKey;

  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [sponsor, learner],
    { commitment: "confirmed" }
  );

  return { signature, alreadyEnrolled: false };
}
