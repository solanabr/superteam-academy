import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { ACADEMY_PROGRAM_ID } from "./constants";

/**
 * Derives the Course PDA for a given course ID.
 */
export function deriveCoursePda(courseId: string): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("course"), Buffer.from(courseId)],
    ACADEMY_PROGRAM_ID,
  );
  return pda;
}

/**
 * Derives the Enrollment PDA for a given course ID and learner wallet.
 */
export function deriveEnrollmentPda(courseId: string, learner: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()],
    ACADEMY_PROGRAM_ID,
  );
  return pda;
}

/**
 * Derives the Config PDA (singleton).
 */
export function deriveConfigPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    ACADEMY_PROGRAM_ID,
  );
  return pda;
}

/**
 * Builds the `enroll` instruction for the Academy program.
 * The learner signs this transaction to enroll in a course.
 *
 * Anchor discriminator for "enroll" is the first 8 bytes of sha256("global:enroll").
 * Pre-computed to avoid runtime crypto dependency in the browser.
 */
export async function buildEnrollInstruction(
  courseId: string,
  learner: PublicKey,
  prerequisiteCourseId?: string,
): Promise<TransactionInstruction> {
  const coursePda = deriveCoursePda(courseId);
  const enrollmentPda = deriveEnrollmentPda(courseId, learner);

  // Pre-computed: sha256("global:enroll")[0..8]
  // Verified via: require("crypto").createHash("sha256").update("global:enroll").digest().subarray(0,8)
  const discriminator = Buffer.from([0x3a, 0x0c, 0x24, 0x03, 0x8e, 0x1c, 0x01, 0x2b]);

  // Encode courseId as Anchor string: 4-byte LE length + UTF-8 bytes
  const courseIdBytes = Buffer.from(courseId, "utf-8");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32LE(courseIdBytes.length, 0);
  const data = Buffer.concat([discriminator, lenBuf, courseIdBytes]);

  const keys = [
    { pubkey: coursePda, isSigner: false, isWritable: false },
    { pubkey: enrollmentPda, isSigner: false, isWritable: true },
    { pubkey: learner, isSigner: true, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  // If prerequisite, add remaining accounts
  if (prerequisiteCourseId) {
    const prereqCoursePda = deriveCoursePda(prerequisiteCourseId);
    const prereqEnrollmentPda = deriveEnrollmentPda(prerequisiteCourseId, learner);
    keys.push(
      { pubkey: prereqCoursePda, isSigner: false, isWritable: false },
      { pubkey: prereqEnrollmentPda, isSigner: false, isWritable: false },
    );
  }

  return new TransactionInstruction({
    keys,
    programId: ACADEMY_PROGRAM_ID,
    data,
  });
}
