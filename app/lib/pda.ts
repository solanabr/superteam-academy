import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./constants";

export function getConfigPda(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    PROGRAM_ID
  )[0];
}

export function getCoursePda(courseId: string): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("course"), Buffer.from(courseId)],
    PROGRAM_ID
  )[0];
}

export function getEnrollmentPda(courseId: string, learner: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()],
    PROGRAM_ID
  )[0];
}

export function getMinterPda(minter: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("minter"), minter.toBuffer()],
    PROGRAM_ID
  )[0];
}

export function getAchievementTypePda(achievementId: string): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("achievement"), Buffer.from(achievementId)],
    PROGRAM_ID
  )[0];
}

export function getAchievementReceiptPda(
  achievementId: string,
  recipient: PublicKey
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("achievement_receipt"),
      Buffer.from(achievementId),
      recipient.toBuffer(),
    ],
    PROGRAM_ID
  )[0];
}
