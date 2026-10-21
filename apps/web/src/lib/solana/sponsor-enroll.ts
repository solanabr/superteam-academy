import "server-only";

import { after } from "next/server";
import { PublicKey, Transaction } from "@solana/web3.js";
import bs58 from "bs58";
import {
  findLiveSponsoredEnroll,
  reserveSponsoredEnroll,
  supersedeSponsoredEnroll,
  type SponsorshipAction,
  type SponsorshipKey,
} from "@/lib/platform-spend/ledger";
import {
  defaultSettleDeps,
  settleRows,
  type SettleOutcome,
} from "@/lib/platform-spend/settle";
import {
  emitServerEvent,
  type SponsorDeclineReason,
} from "@/lib/platform-spend/events";
import { getConnection, getPlatformFeePayer } from "./academy-program";
import {
  courseGeneration,
  enrollmentCourseGeneration,
} from "./course-generation";
import { buildEnrollInstruction } from "./instructions";
import { findCoursePDA, findEnrollmentPDA, getProgramId } from "./pda";

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
 *
 * A wallet is sponsored at most once per course generation of a program. The
 * pending ledger row written here is the reservation: a partial unique index
 * holds one live (pending or confirmed) row per program, wallet, course and
 * `Course.generation`, so a learner who closes and re-enrolls pays for the
 * second enrollment, while a recreated course or a program move is a new slot.
 * Re-initialising an enrollment left from a superseded generation charges no
 * rent, so it is sponsored as `enroll_sponsor_reenroll` without using up the
 * generation's slot. A learner already enrolled in the current generation is
 * not sponsored: that `enroll` can only fail.
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

/** The Course account is missing, so there is no generation to key on. */
export class CourseNotOnChainError extends Error {
  constructor(courseId: string) {
    super(`Course account for "${courseId}" not found on-chain`);
    this.name = "CourseNotOnChainError";
  }
}

/**
 * Where the once-per slot stands. A pending row is settled first: it may have
 * landed (the slot is used), failed or expired (free again), or still be in
 * flight. A pending row the cluster has never seen was abandoned (a cancelled
 * or failed signature): it is superseded so the learner can try again at
 * once. If it lands after all, the replacement fails for a fee, and
 * settlement still records the late landing against the slot.
 */
async function slotState(
  action: SponsorshipAction,
  key: SponsorshipKey
): Promise<"free" | "used" | "in_flight"> {
  const prior = await findLiveSponsoredEnroll(action, key);
  if (!prior) return "free";
  if (prior.status === "confirmed") return "used";

  const settled = await settleRows([{ ...prior, status: "pending" }], {
    ...defaultSettleDeps(getConnection()),
    // The settled event goes out after the response, not on the learner's
    // request path.
    emit: async (event) => {
      after(() => emitServerEvent(event));
    },
  });
  const outcome: SettleOutcome = settled.get(prior.signature) ?? "pending";
  if (outcome === "confirmed") return "used";
  if (outcome === "unseen") {
    return (await supersedeSponsoredEnroll(prior.signature))
      ? "free"
      : "in_flight";
  }
  return outcome === "pending" ? "in_flight" : "free";
}

export async function buildSponsoredEnrollTransaction(
  courseId: string,
  learner: PublicKey,
  userId: string
): Promise<SponsoredEnrollResult> {
  const connection = getConnection();
  // Throws SponsorUnavailableError on mainnet without SPONSOR_SECRET.
  const sponsor = await getPlatformFeePayer();
  const programId = getProgramId();
  const wallet = learner.toBase58();

  // One round trip for both: the Course's generation keys the slot, and an
  // existing Enrollment decides between a fresh enroll and a re-enroll.
  const [coursePda] = findCoursePDA(courseId, programId);
  const [enrollmentPda] = findEnrollmentPDA(courseId, learner, programId);
  const [courseInfo, enrollmentInfo] = await connection.getMultipleAccountsInfo(
    [coursePda, enrollmentPda]
  );
  if (!courseInfo) throw new CourseNotOnChainError(courseId);
  const generation = courseGeneration(courseInfo.data);

  let action: SponsorshipAction = "enroll_sponsor";
  if (enrollmentInfo?.owner.equals(programId)) {
    if (enrollmentCourseGeneration(enrollmentInfo.data) === generation) {
      return { ok: false, reason: "already_enrolled" };
    }
    // Left from a superseded generation: re-initialised in place, no rent.
    action = "enroll_sponsor_reenroll";
  }

  const key: SponsorshipKey = {
    wallet,
    courseId,
    programId: programId.toBase58(),
    courseGeneration: generation,
  };
  const slot = await slotState(action, key);
  if (slot === "used") return { ok: false, reason: "already_sponsored" };
  if (slot === "in_flight") return { ok: false, reason: "in_flight" };

  const instruction = buildEnrollInstruction(
    courseId,
    learner,
    programId,
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
    ...key,
    signature,
    action,
    userId,
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
