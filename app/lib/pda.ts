import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./constants";

export function getConfigPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    PROGRAM_ID
  );
}

export function getCoursePda(courseId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("course"), Buffer.from(courseId)],
    PROGRAM_ID
  );
}

export function getEnrollmentPda(
  courseId: string,
  learner: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()],
    PROGRAM_ID
  );
}

export function getMinterRolePda(minter: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("minter"), minter.toBuffer()],
    PROGRAM_ID
  );
}

export function getAchievementTypePda(
  achievementId: string
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("achievement"), Buffer.from(achievementId)],
    PROGRAM_ID
  );
}

export function getAchievementReceiptPda(
  achievementId: string,
  recipient: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("achievement_receipt"),
      Buffer.from(achievementId),
      recipient.toBuffer(),
    ],
    PROGRAM_ID
  );
}