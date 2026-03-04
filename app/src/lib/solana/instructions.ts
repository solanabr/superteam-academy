import { SystemProgram, Transaction } from "@solana/web3.js";
import { getProgramWithWallet } from "./program";
import { getCoursePda, getEnrollmentPda } from "./pdas";
import { getTypedMethods } from "./typed-program";
import type { AnchorWallet } from "@solana/wallet-adapter-react";

export async function buildEnrollTx(
  wallet: AnchorWallet,
  courseId: string,
  prerequisiteCourseId?: string
): Promise<Transaction> {
  const program = await getProgramWithWallet(wallet);
  const [coursePda] = getCoursePda(courseId);
  const [enrollmentPda] = getEnrollmentPda(courseId, wallet.publicKey);

  let builder = getTypedMethods(program)
    .enroll(courseId)
    .accountsPartial({
      course: coursePda,
      enrollment: enrollmentPda,
      learner: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    });

  if (prerequisiteCourseId) {
    const [prereqCoursePda] = getCoursePda(prerequisiteCourseId);
    const [prereqEnrollmentPda] = getEnrollmentPda(
      prerequisiteCourseId,
      wallet.publicKey
    );
    builder = builder.remainingAccounts([
      { pubkey: prereqCoursePda, isWritable: false, isSigner: false },
      { pubkey: prereqEnrollmentPda, isWritable: false, isSigner: false },
    ]);
  }

  return await builder.transaction();
}
