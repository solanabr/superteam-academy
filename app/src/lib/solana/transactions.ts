import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { findConfigPDA, findCoursePDA, findEnrollmentPDA } from "./pda";

/**
 * Enroll the connected wallet in a course.
 * Reads the on-chain Course account to check for prerequisites,
 * then derives the correct remaining accounts from on-chain data.
 */
export async function enroll(
  program: Program,
  user: PublicKey,
  courseId: string,
): Promise<string> {
  const [coursePDA] = findCoursePDA(courseId);
  const [enrollment] = findEnrollmentPDA(courseId, user);

  // Read on-chain course to get actual prerequisite
  const courseAccount = await (program.account as any).course.fetch(coursePDA);

  const remainingAccounts: any[] = [];
  if (courseAccount.prerequisite) {
    const prereqCoursePubkey = courseAccount.prerequisite as PublicKey;
    // Read prerequisite course to get its course_id for enrollment PDA derivation
    const prereqCourseAccount = await (program.account as any).course.fetch(
      prereqCoursePubkey,
    );
    const prereqCourseId = prereqCourseAccount.courseId as string;
    const [prereqEnrollment] = findEnrollmentPDA(prereqCourseId, user);
    remainingAccounts.push(
      { pubkey: prereqCoursePubkey, isWritable: false, isSigner: false },
      { pubkey: prereqEnrollment, isWritable: false, isSigner: false },
    );
  }

  return program.methods
    .enroll(courseId)
    .accounts({
      course: coursePDA,
      enrollment,
      learner: user,
      systemProgram: SystemProgram.programId,
    })
    .remainingAccounts(remainingAccounts)
    .rpc();
}

/**
 * Close an enrollment PDA and reclaim rent to the user's wallet.
 * Can be used for unenrolling (24h cooldown) or reclaiming after completion.
 */
export async function closeEnrollment(
  program: Program,
  user: PublicKey,
  courseId: string,
): Promise<string> {
  const [course] = findCoursePDA(courseId);
  const [enrollment] = findEnrollmentPDA(courseId, user);

  return program.methods
    .closeEnrollment()
    .accounts({
      course,
      enrollment,
      learner: user,
    })
    .rpc();
}
