import { PublicKey } from "@solana/web3.js"

export const DEFAULT_PROGRAM_ID = "ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf"
export const DEFAULT_TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
export const DEFAULT_ASSOCIATED_TOKEN_PROGRAM_ID = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
export const DEFAULT_MPL_CORE_PROGRAM_ID = "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"

export function getProgramId() {
  return new PublicKey(process.env.NEXT_PUBLIC_SOLANA_PROGRAM_ID ?? DEFAULT_PROGRAM_ID)
}

export function getToken2022ProgramId() {
  return new PublicKey(DEFAULT_TOKEN_2022_PROGRAM_ID)
}

export function getAssociatedTokenProgramId() {
  return new PublicKey(DEFAULT_ASSOCIATED_TOKEN_PROGRAM_ID)
}

export function getMplCoreProgramId() {
  return new PublicKey(DEFAULT_MPL_CORE_PROGRAM_ID)
}

export function getConfigPda(programId = getProgramId()) {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], programId)[0]
}

export function getCoursePda(courseId: string, programId = getProgramId()) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("course"), Buffer.from(courseId)],
    programId
  )[0]
}

export function getEnrollmentPda(courseId: string, learner: PublicKey, programId = getProgramId()) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()],
    programId
  )[0]
}

export function deriveToken2022Ata(mint: PublicKey, owner: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), getToken2022ProgramId().toBuffer(), mint.toBuffer()],
    getAssociatedTokenProgramId()
  )[0]
}
