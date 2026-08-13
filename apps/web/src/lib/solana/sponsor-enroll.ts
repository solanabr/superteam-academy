import "server-only";

import { PublicKey, Transaction } from "@solana/web3.js";
import { getBackendSigner, getConnection } from "./academy-program";
import { buildEnrollInstruction } from "./instructions";
import { getProgramId } from "./pda";

/**
 * Sponsored `enroll` (#1004).
 *
 * A freshly created wallet arrives holding zero SOL, and `enroll` is
 * the only instruction a learner has to fund — everything after it
 * (`complete_lesson`, `finalize_course`, `issue_credential`) is already paid for
 * by the backend. So without this, an email sign-up could get a wallet and then
 * never start a course.
 *
 * ## Why this returns a transaction instead of a signature
 *
 * The obvious shape — route builds it, signs it, sends it, returns the
 * signature — cannot work: `enroll` requires the LEARNER's signature too. Their
 * address seeds the Enrollment PDA and their signature is the consent to
 * enrol, and the server does not hold their key (that is the whole point of a
 * non-custodial embedded wallet). So the server pays and partially signs, then
 * hands the transaction back for the learner's wallet to co-sign and submit.
 *
 * ## Why the server builds the instruction itself
 *
 * It would be far easier to accept a serialised transaction from the client and
 * just add a signature to it. That is a funded-key drain: the backend signer
 * would be co-signing arbitrary bytes, and nothing would stop a caller
 * substituting a transfer instruction. Everything here is constructed from
 * two validated inputs, so the only thing this key can ever be made to sign is
 * an `enroll` for the named learner.
 */
export interface SponsoredEnrollTransaction {
  /** Base64 transaction, sponsor-signed, still missing the learner signature. */
  transaction: string;
  /** The sponsoring pubkey, so the client can assert who it is co-signing with. */
  sponsor: string;
  /** Lets the client stop waiting once the blockhash can no longer land. */
  lastValidBlockHeight: number;
}

export async function buildSponsoredEnrollTransaction(
  courseId: string,
  learner: PublicKey
): Promise<SponsoredEnrollTransaction> {
  const connection = getConnection();
  const sponsor = getBackendSigner();

  const instruction = buildEnrollInstruction(
    courseId,
    learner,
    getProgramId(),
    sponsor.publicKey
  );

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  const transaction = new Transaction().add(instruction);
  // The sponsor covers the fee as well as the rent — a wallet with no SOL
  // cannot be the fee payer either.
  transaction.feePayer = sponsor.publicKey;
  transaction.recentBlockhash = blockhash;
  transaction.partialSign(sponsor);

  return {
    // `requireAllSignatures: false` is what allows serialising while the
    // learner's signature slot is still empty; `verifySignatures: false` stops
    // web3.js rejecting that same incompleteness on the way out.
    transaction: transaction
      .serialize({ requireAllSignatures: false, verifySignatures: false })
      .toString("base64"),
    sponsor: sponsor.publicKey.toBase58(),
    lastValidBlockHeight,
  };
}
