import { PublicKey, SystemProgram } from "@solana/web3.js";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { getSignerProgram, connection } from "./program-client";
import { deriveCoursePda, deriveEnrollmentPda } from "./pda";

export async function enrollOnChain(
  wallet: AnchorWallet,
  courseId: string,
  prerequisiteCourseId?: string,
): Promise<string> {
  const program = getSignerProgram(wallet);

  const [coursePda] = deriveCoursePda(courseId);
  const [enrollmentPda] = deriveEnrollmentPda(courseId, wallet.publicKey);

  const remainingAccounts: Array<{
    pubkey: PublicKey;
    isSigner: boolean;
    isWritable: boolean;
  }> = [];

  if (prerequisiteCourseId) {
    const [prereqCoursePda] = deriveCoursePda(prerequisiteCourseId);
    const [prereqEnrollmentPda] = deriveEnrollmentPda(
      prerequisiteCourseId,
      wallet.publicKey,
    );
    remainingAccounts.push(
      { pubkey: prereqCoursePda, isSigner: false, isWritable: false },
      { pubkey: prereqEnrollmentPda, isSigner: false, isWritable: false },
    );
  }

  const sig = await program.methods
    .enroll(courseId)
    .accountsPartial({
      course: coursePda,
      enrollment: enrollmentPda,
      learner: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .remainingAccounts(remainingAccounts)
    .rpc({ commitment: "confirmed" });

  return sig;
}
