import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "@/types/academy";

export function getConfigPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    PROGRAM_ID
  );
  return pda;
}

export function getCoursePda(courseId: string): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("course"), Buffer.from(courseId)],
    PROGRAM_ID
  );
  return pda;
}

export function getEnrollmentPda(courseId: string, learner: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

export function getMinterRolePda(minter: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("minter"), minter.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

export function getAchievementTypePda(achievementId: string): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("achievement"), Buffer.from(achievementId)],
    PROGRAM_ID
  );
  return pda;
}

export function getAchievementReceiptPda(achievementId: string, recipient: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("achievement_receipt"), Buffer.from(achievementId), recipient.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}
