import { PublicKey } from "@solana/web3.js";
import { ACADEMY_PROGRAM_ID } from "./constants";

export const deriveEnrollmentPda = (
  wallet: PublicKey,
  courseId: string,
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("enrollment"), wallet.toBuffer(), Buffer.from(courseId)],
    ACADEMY_PROGRAM_ID,
  );
};

export const deriveProgressPda = (
  wallet: PublicKey,
  courseId: string,
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("progress"), wallet.toBuffer(), Buffer.from(courseId)],
    ACADEMY_PROGRAM_ID,
  );
};
