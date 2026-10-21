import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import type { Idl } from "@coral-xyz/anchor";
import { BorshCoder } from "@coral-xyz/anchor";
import IDL from "./idl/superteam_academy_vnext.json";
import { findCoursePDA, findEnrollmentPDA, getProgramId } from "./pda";

const coder = new BorshCoder(IDL as unknown as Idl);

/**
 * `enroll` (#1004).
 *
 * `payer` funds the Enrollment PDA rent and defaults to the learner, so an
 * existing caller that omits it keeps the old self-paid behaviour exactly.
 * Passing a different payer is what lets an embedded wallet — which arrives
 * holding zero SOL — enrol at all. The learner still signs: their
 * address seeds the Enrollment PDA and their signature is the consent.
 *
 * BOTH accounts are signers. When they are the same address web3.js merges the
 * duplicate metas and takes the union of the flags, so the learner ends up
 * signer + writable and the self-pay path is byte-identical to before.
 */
export function buildEnrollInstruction(
  courseId: string,
  learner: PublicKey,
  programId: PublicKey = getProgramId(),
  payer: PublicKey = learner
): TransactionInstruction {
  const [coursePDA] = findCoursePDA(courseId, programId);
  const [enrollmentPDA] = findEnrollmentPDA(courseId, learner, programId);

  // BorshCoder uses snake_case method names matching the IDL
  const data = coder.instruction.encode("enroll", { course_id: courseId });

  return new TransactionInstruction({
    keys: [
      { pubkey: coursePDA, isSigner: false, isWritable: true },
      { pubkey: enrollmentPDA, isSigner: false, isWritable: true },
      { pubkey: learner, isSigner: true, isWritable: false },
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId,
    data,
  });
}

/**
 * `close_enrollment`. The rent goes to `rentRecipient`, which the program
 * requires to be the payer recorded at enroll (or the learner for an
 * enrollment that predates the payer field): read it with
 * `fetchEnrollmentRentRecipient`. The learner still signs.
 *
 * The recipient is the fourth and last account, so a program build that reads
 * only three accounts ignores it.
 */
export function buildCloseEnrollmentInstruction(
  courseId: string,
  learner: PublicKey,
  rentRecipient: PublicKey,
  programId: PublicKey = getProgramId()
): TransactionInstruction {
  const [coursePDA] = findCoursePDA(courseId, programId);
  const [enrollmentPDA] = findEnrollmentPDA(courseId, learner, programId);

  const data = coder.instruction.encode("close_enrollment", {});

  return new TransactionInstruction({
    keys: [
      { pubkey: coursePDA, isSigner: false, isWritable: false },
      { pubkey: enrollmentPDA, isSigner: false, isWritable: true },
      { pubkey: learner, isSigner: true, isWritable: true },
      { pubkey: rentRecipient, isSigner: false, isWritable: true },
    ],
    programId,
    data,
  });
}
