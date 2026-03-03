/**
 * PDA (Program Derived Address) derivation helpers for the Superteam Academy
 * on-chain program. Each function returns `[address, bump]` matching the
 * seeds defined in the Anchor program's account constraints.
 *
 * @see https://github.com/solanabr/superteam-academy — program source
 */

import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./constants";

/** Derive the singleton Config PDA. Seeds: `["config"]` */
export function getConfigPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
}

/**
 * Derive a Course PDA from its slug identifier.
 * Seeds: `["course", courseId]`
 * @param courseId - Unique course slug (e.g. "solana-fundamentals")
 */
export function getCoursePda(courseId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("course"), Buffer.from(courseId)],
    PROGRAM_ID,
  );
}

/**
 * Derive an Enrollment PDA for a learner in a specific course.
 * Seeds: `["enrollment", courseId, learner]`
 * @param courseId - Unique course slug
 * @param learner - Learner's wallet public key
 */
export function getEnrollmentPda(
  courseId: string,
  learner: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()],
    PROGRAM_ID,
  );
}

/**
 * Derive a Minter Role PDA (authorizes a backend signer to mint XP).
 * Seeds: `["minter", minter]`
 * @param minter - Public key of the authorized minter
 */
export function getMinterRolePda(minter: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("minter"), minter.toBuffer()],
    PROGRAM_ID,
  );
}

/**
 * Derive an Achievement Type PDA (defines an achievement's metadata).
 * Seeds: `["achievement", achievementId]`
 * @param achievementId - Unique achievement identifier string
 */
export function getAchievementTypePda(
  achievementId: string,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("achievement"), Buffer.from(achievementId)],
    PROGRAM_ID,
  );
}

/**
 * Derive an Achievement Receipt PDA (proves a learner claimed an achievement).
 * Seeds: `["achievement_receipt", achievementId, recipient]`
 * @param achievementId - Unique achievement identifier string
 * @param recipient - Learner's wallet public key
 */
export function getAchievementReceiptPda(
  achievementId: string,
  recipient: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("achievement_receipt"),
      Buffer.from(achievementId),
      recipient.toBuffer(),
    ],
    PROGRAM_ID,
  );
}
