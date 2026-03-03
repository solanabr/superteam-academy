import { type PublicKey } from "@solana/web3.js";
import { getConnection } from "../program";
import { getEnrollmentPda } from "../pda";

/**
 * Check if a wallet is enrolled in a course on-chain.
 */
export async function checkEnrollmentOnChain(
  learner: PublicKey,
  courseId: string,
  rpcUrl?: string,
): Promise<boolean> {
  const connection = getConnection(rpcUrl);
  const [enrollmentPda] = getEnrollmentPda(courseId, learner);
  const info = await connection.getAccountInfo(enrollmentPda);
  return info !== null;
}
