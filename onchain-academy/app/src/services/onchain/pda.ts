import { PublicKey } from "@solana/web3.js";
import { ONCHAIN_ACADEMY_PROGRAM_ID } from "./constants";

const PROGRAM_ID = new PublicKey(ONCHAIN_ACADEMY_PROGRAM_ID);

export function getConfigPda() {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID)[0];
}

export function getCoursePda(courseId: string) {
  return PublicKey.findProgramAddressSync([Buffer.from("course"), Buffer.from(courseId)], PROGRAM_ID)[0];
}

export function getEnrollmentPda(courseId: string, learner: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()],
    PROGRAM_ID,
  )[0];
}
