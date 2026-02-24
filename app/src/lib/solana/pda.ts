import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID as PROGRAM_ID_STR } from "@/lib/constants";

const PROGRAM_ID = new PublicKey(PROGRAM_ID_STR);

export function findConfigPDA(programIdOverride?: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    programIdOverride ?? PROGRAM_ID,
  );
}

export function findCoursePDA(courseId: string, programIdOverride?: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("course"), Buffer.from(courseId)],
    programIdOverride ?? PROGRAM_ID,
  );
}

export function findEnrollmentPDA(
  courseId: string,
  user: PublicKey,
  programIdOverride?: PublicKey,
) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("enrollment"), Buffer.from(courseId), user.toBuffer()],
    programIdOverride ?? PROGRAM_ID,
  );
}

export function findMinterPDA(
  minter: PublicKey,
  programIdOverride?: PublicKey,
) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("minter"), minter.toBuffer()],
    programIdOverride ?? PROGRAM_ID,
  );
}
