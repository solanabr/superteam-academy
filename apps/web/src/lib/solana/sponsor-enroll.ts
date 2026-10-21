import "server-only";

import { after } from "next/server";
import { PublicKey, Transaction } from "@solana/web3.js";
import bs58 from "bs58";
import {
  findLiveSponsoredEnroll,
  reserveSponsoredEnroll,
  type SpendStatus,
} from "@/lib/platform-spend/ledger";
import { defaultSettleDeps, settleRows } from "@/lib/platform-spend/settle";
import {
  emitServerEvent,
  type SponsorDeclineReason,
} from "@/lib/platform-spend/events";
import { getConnection, getPlatformFeePayer } from "./academy-program";
import { buildEnrollInstruction } from "./instructions";
import { getProgramId } from "./pda";

/**
 * Sponsored `enroll` (#1004).
 *
 * An embedded wallet (Dynamic) arrives holding zero SOL, and `enroll` is
 * the only instruction a learner has to fund — everything after it
 * (`complete_lesson`, `finalize_course`, `issue_credential`) is already paid for
 * by the platform. So without this, an email sign-up could get a wallet and then
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
 * just add a signature to it. That is a funded-key drain: the sponsor would be
 * co-signing arbitrary bytes, and nothing would stop a caller
 * substituting a transfer instruction. Everything here is constructed from
 * two validated inputs, so the only thing this key can ever be made to sign is
 * an `enroll` for the named learner.
 *
 * ## Who pays, and how often
 *
 * The sponsor wallet (`SPONSOR_SECRET`) is the `payer` and the fee payer; see
 * resolveFeePayer for the devnet fallback and the mainnet fail-closed rule.
 * A wallet is sponsored at most once per course, ever. The pending ledger row
 * written here is the reservation: a partial unique index holds one live
 * (pending or confirmed) `enroll_sponsor` row per wallet and course, so a
 * learner who closes and re-enrolls pays for the second enrollment.
 */
export interface SponsoredEnrollTransaction {
  /** Base64 transaction, sponsor-signed, still missing the learner signature. */
  transaction: string;
  /** The sponsoring pubkey, so the client can assert who it is co-signing with. */
  sponsor: string;
  /** Lets the client stop waiting once the blockhash can no longer land. */
  lastValidBlockHeight: number;
}

export type SponsoredEnrollResult =
  | { ok: true; transaction: SponsoredEnrollTransaction }
  | { ok: false; reason: SponsorDeclineReason };

/**
 * Where the once-per slot for this wallet and course stands. A pending row is
 * settled first: it may have landed (the slot is used), failed or expired (the
 * slot is free again), or still be in flight.
 */
async function priorSponsorship(
  wallet: string,
  courseId: string
): Promise<SpendStatus | null> {
  const prior = await findLiveSponsoredEnroll(wallet, courseId);
  if (!prior) return null;
  if (prior.status !== "pending") return prior.status;
  const settled = await settleRows([prior], {
    ...defaultSettleDeps(getConnection()),
    // The settled event goes out after the response, not on the learner's
    // request path.
    emit: async (event) => {
      after(() => emitServerEvent(event));
    },
  });
  return settled.get(prior.signature) ?? "pending";
}

export async function buildSponsoredEnrollTransaction(
  courseId: string,
  learner: PublicKey,
  userId: string
): Promise<SponsoredEnrollResult> {
  const connection = getConnection();
  // Throws SponsorUnavailableError on mainnet without SPONSOR_SECRET.
  const sponsor = await getPlatformFeePayer();
  const wallet = learner.toBase58();

  const prior = await priorSponsorship(wallet, courseId);
  if (prior === "confirmed") return { ok: false, reason: "already_sponsored" };
  if (prior === "pending") return { ok: false, reason: "in_flight" };

  const instruction = buildEnrollInstruction(
    courseId,
    learner,
    getProgramId(),
    sponsor.keypair.publicKey
  );

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  const transaction = new Transaction().add(instruction);
  // The sponsor covers the fee as well as the rent — a wallet with no SOL
  // cannot be the fee payer either.
  transaction.feePayer = sponsor.keypair.publicKey;
  transaction.recentBlockhash = blockhash;
  transaction.partialSign(sponsor.keypair);
  // The fee payer signs first, so its signature is the transaction id the
  // learner's submission will land under.
  if (!transaction.signature) throw new Error("sponsor failed to sign");
  const signature = bs58.encode(transaction.signature);

  // Reserve before handing anything out. A concurrent request that reserved
  // first wins; this one is declined rather than sponsored twice.
  const reserved = await reserveSponsoredEnroll({
    signature,
    action: "enroll_sponsor",
    userId,
    wallet,
    courseId,
    payer: sponsor.keypair.publicKey.toBase58(),
    payerRole: sponsor.role,
    lastValidBlockHeight,
  });
  if (reserved === "conflict") return { ok: false, reason: "in_flight" };

  return {
    ok: true,
    transaction: {
      // `requireAllSignatures: false` is what allows serialising while the
      // learner's signature slot is still empty; `verifySignatures: false`
      // stops web3.js rejecting that same incompleteness on the way out.
      transaction: transaction
        .serialize({ requireAllSignatures: false, verifySignatures: false })
        .toString("base64"),
      sponsor: sponsor.keypair.publicKey.toBase58(),
      lastValidBlockHeight,
    },
  };
}
