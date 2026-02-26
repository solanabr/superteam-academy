import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? "ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf"
);

export const TOKEN_2022_PROGRAM_ID = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);

export const MPL_CORE_PROGRAM_ID = new PublicKey(
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
);

export function deriveConfigPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
}

export function deriveCoursePda(courseId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("course"), Buffer.from(courseId)],
    PROGRAM_ID
  );
}

export function deriveEnrollmentPda(
  courseId: string,
  learner: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()],
    PROGRAM_ID
  );
}

export function deriveMinterRolePda(minter: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("minter"), minter.toBuffer()],
    PROGRAM_ID
  );
}

export function deriveAchievementTypePda(achievementId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("achievement"), Buffer.from(achievementId)],
    PROGRAM_ID
  );
}

export function deriveAchievementReceiptPda(
  achievementId: string,
  recipient: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("achievement_receipt"), Buffer.from(achievementId), recipient.toBuffer()],
    PROGRAM_ID
  );
}
