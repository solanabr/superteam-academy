import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  ACADEMY_PROGRAM_ID,
  ACADEMY_RPC_URL,
} from "@/lib/generated/academy-program";

const ENROLL_DISCRIMINATOR = Buffer.from([58, 12, 36, 3, 142, 28, 1, 43]);

/** Returned when the enrollment account already exists on-chain. */
export const ALREADY_ENROLLED = "__already_enrolled__";

function deriveCoursePda(slug: string): PublicKey {
  const programId = new PublicKey(ACADEMY_PROGRAM_ID);
  const [coursePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("course"), Buffer.from(slug)],
    programId,
  );
  return coursePda;
}

function deriveEnrollmentPda(course: PublicKey, user: PublicKey): PublicKey {
  const programId = new PublicKey(ACADEMY_PROGRAM_ID);
  const [enrollmentPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("enrollment"), course.toBuffer(), user.toBuffer()],
    programId,
  );
  return enrollmentPda;
}

/** Check whether the enrollment PDA already exists on-chain. */
export async function checkEnrollmentExists(
  walletAddress: string,
  courseSlug: string,
): Promise<boolean> {
  try {
    const connection = new Connection(ACADEMY_RPC_URL, "confirmed");
    const user = new PublicKey(walletAddress);
    const course = deriveCoursePda(courseSlug);
    const enrollment = deriveEnrollmentPda(course, user);
    const info = await connection.getAccountInfo(enrollment);
    return info !== null;
  } catch {
    return false;
  }
}

export async function sendEnrollCourse(
  sendTransaction: (tx: Transaction, connection: Connection) => Promise<string>,
  walletAddress: string,
  courseSlug: string,
): Promise<string> {
  const user = new PublicKey(walletAddress);
  const programId = new PublicKey(ACADEMY_PROGRAM_ID);
  const course = deriveCoursePda(courseSlug);
  const enrollment = deriveEnrollmentPda(course, user);

  const connection = new Connection(ACADEMY_RPC_URL, "confirmed");

  // Pre-check: skip transaction if enrollment already exists on-chain
  try {
    const existing = await connection.getAccountInfo(enrollment);
    if (existing) return ALREADY_ENROLLED;
  } catch {
    // RPC check failed — proceed with enrollment attempt;
    // the on-chain program will reject if already enrolled
  }

  const instruction = new TransactionInstruction({
    programId,
    keys: [
      { pubkey: course, isSigner: false, isWritable: true },
      { pubkey: enrollment, isSigner: false, isWritable: true },
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: ENROLL_DISCRIMINATOR,
  });

  const tx = new Transaction();
  tx.add(instruction);
  tx.feePayer = user;

  const signature = await sendTransaction(tx, connection);
  await connection.confirmTransaction(signature, "confirmed");
  return signature;
}
