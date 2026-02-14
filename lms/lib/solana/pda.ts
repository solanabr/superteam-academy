import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./constants";

export function getConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
}

export function getCoursePDA(courseId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("course"), Buffer.from(courseId)],
    PROGRAM_ID
  );
}

export function getLearnerPDA(wallet: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("learner"), wallet.toBuffer()],
    PROGRAM_ID
  );
}

export function getEnrollmentPDA(courseId: string, wallet: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("enrollment"), Buffer.from(courseId), wallet.toBuffer()],
    PROGRAM_ID
  );
}
