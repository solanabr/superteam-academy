import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import type { Idl } from "@coral-xyz/anchor";
import { BorshCoder } from "@coral-xyz/anchor";
import IDL from "./idl/superteam_academy.json";
import { findCoursePDA, findEnrollmentPDA, PROGRAM_ID } from "./pda";

const coder = new BorshCoder(IDL as unknown as Idl);

export function buildEnrollInstruction(
  courseId: string,
  learner: PublicKey,
  programId: PublicKey = PROGRAM_ID
): TransactionInstruction {
  const [coursePDA] = findCoursePDA(courseId, programId);
  const [enrollmentPDA] = findEnrollmentPDA(courseId, learner, programId);

  // BorshCoder uses snake_case method names matching the IDL
  const data = coder.instruction.encode("enroll", { course_id: courseId });

  return new TransactionInstruction({
    keys: [
      { pubkey: coursePDA, isSigner: false, isWritable: true },
      { pubkey: enrollmentPDA, isSigner: false, isWritable: true },
      { pubkey: learner, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId,
    data,
  });
}

export function buildCloseEnrollmentInstruction(
  courseId: string,
  learner: PublicKey,
  programId: PublicKey = PROGRAM_ID
): TransactionInstruction {
  const [coursePDA] = findCoursePDA(courseId, programId);
  const [enrollmentPDA] = findEnrollmentPDA(courseId, learner, programId);

  const data = coder.instruction.encode("close_enrollment", {});

  return new TransactionInstruction({
    keys: [
      { pubkey: coursePDA, isSigner: false, isWritable: false },
      { pubkey: enrollmentPDA, isSigner: false, isWritable: true },
      { pubkey: learner, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId,
    data,
  });
}
