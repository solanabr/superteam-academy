import { PublicKey } from "@solana/web3.js";
import { ACADEMY_PROGRAM_ID } from "./constants";

export const deriveConfigPda = (): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    ACADEMY_PROGRAM_ID,
  );
};

export const deriveCoursePda = (courseId: string): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("course"), Buffer.from(courseId)],
    ACADEMY_PROGRAM_ID,
  );
};

export const deriveEnrollmentPda = (
  courseId: string,
  learner: PublicKey,
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()],
    ACADEMY_PROGRAM_ID,
  );
};

export const deriveMinterRolePda = (
  minter: PublicKey,
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("minter"), minter.toBuffer()],
    ACADEMY_PROGRAM_ID,
  );
};

export const deriveAchievementTypePda = (
  achievementId: string,
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("achievement"), Buffer.from(achievementId)],
    ACADEMY_PROGRAM_ID,
  );
};

export const deriveAchievementReceiptPda = (
  achievementId: string,
  recipient: PublicKey,
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("achievement_receipt"),
      Buffer.from(achievementId),
      recipient.toBuffer(),
    ],
    ACADEMY_PROGRAM_ID,
  );
};
