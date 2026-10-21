import { Connection, PublicKey } from "@solana/web3.js";
import { findEnrollmentPDA, getProgramId } from "./pda";

/**
 * Who `close_enrollment` refunds. The program records the rent payer at
 * enroll time, after the 127-byte Borsh body, and only lets the rent go back to
 * that payer. Enrollments created before the payer was recorded are 127 bytes
 * and refund the learner. Decoders read the body and ignore the trailing payer,
 * so nothing else in the app needs to know about it.
 */
export const LEGACY_ENROLLMENT_SIZE = 127;
export const ENROLLMENT_SIZE = 159;
export const ENROLLMENT_PAYER_OFFSET = 127;

/** The rent recipient for an Enrollment account's raw data. */
export function enrollmentRentRecipient(
  data: Uint8Array,
  learner: PublicKey
): PublicKey {
  if (data.length === ENROLLMENT_SIZE) {
    return new PublicKey(
      data.subarray(ENROLLMENT_PAYER_OFFSET, ENROLLMENT_PAYER_OFFSET + 32)
    );
  }
  if (data.length === LEGACY_ENROLLMENT_SIZE) return learner;
  throw new Error(
    `Unexpected Enrollment account size ${data.length} (expected ${ENROLLMENT_SIZE} or ${LEGACY_ENROLLMENT_SIZE})`
  );
}

/**
 * Reads the learner's Enrollment and returns its rent recipient. With no
 * account it returns the learner, so the close still simulates and fails with
 * the program's own error, as it did before the payer was recorded.
 */
export async function fetchEnrollmentRentRecipient(
  connection: Connection,
  courseId: string,
  learner: PublicKey,
  programId: PublicKey = getProgramId()
): Promise<PublicKey> {
  const [pda] = findEnrollmentPDA(courseId, learner, programId);
  const info = await connection.getAccountInfo(pda);
  return info ? enrollmentRentRecipient(info.data, learner) : learner;
}
