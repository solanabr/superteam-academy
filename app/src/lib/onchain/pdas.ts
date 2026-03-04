import { PublicKey } from "@solana/web3.js";
import { ACADEMY_PROGRAM_ID } from "@/lib/onchain/constants";

function courseIdSeed(courseId: string): Buffer {
  return Buffer.from(courseId, "utf8");
}

function achievementIdSeed(achievementId: string): Buffer {
  return Buffer.from(achievementId, "utf8");
}

export function deriveConfigPda(
  programId: PublicKey = ACADEMY_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], programId);
}

export function deriveCoursePda(
  courseId: string,
  programId: PublicKey = ACADEMY_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("course"), courseIdSeed(courseId)],
    programId
  );
}

export function deriveEnrollmentPda(
  learner: PublicKey,
  courseId: string,
  programId: PublicKey = ACADEMY_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("enrollment"), courseIdSeed(courseId), learner.toBuffer()],
    programId
  );
}

export function deriveAchievementTypePda(
  achievementId: string,
  programId: PublicKey = ACADEMY_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("achievement"), achievementIdSeed(achievementId)],
    programId
  );
}

export function deriveAchievementReceiptPda(
  achievementId: string,
  recipient: PublicKey,
  programId: PublicKey = ACADEMY_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("achievement_receipt"),
      achievementIdSeed(achievementId),
      recipient.toBuffer(),
    ],
    programId
  );
}

export function deriveMinterRolePda(
  minter: PublicKey,
  programId: PublicKey = ACADEMY_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("minter"), minter.toBuffer()],
    programId
  );
}

// Legacy helpers retained for compatibility with older drafts.
export function deriveLearnerAchievementPda(
  learner: PublicKey,
  achievementType: PublicKey,
  programId: PublicKey = ACADEMY_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("learner_achievement"),
      learner.toBuffer(),
      achievementType.toBuffer(),
    ],
    programId
  );
}

export function deriveCompletionReceiptPda(
  learner: PublicKey,
  courseId: string,
  programId: PublicKey = ACADEMY_PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("completion_receipt"), learner.toBuffer(), courseIdSeed(courseId)],
    programId
  );
}
