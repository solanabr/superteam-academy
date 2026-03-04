/**
 * Client-safe Anchor constants and PDA helpers.
 * No Node.js built-ins (fs, path) — safe to import from browser components.
 *
 * Server-only utilities (keypair loading, backend signer, program client)
 * live in src/lib/anchor-program.ts which adds "server-only".
 */

import { PublicKey } from "@solana/web3.js"

// ─── Program constants ────────────────────────────────────────────────────────

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ??
  process.env.NEXT_PUBLIC_SOLANA_PROGRAM_ID ??
  "CqXdxJwoSGLicykvA23DS8fKtbCX61KnyBoBpddFLoUN"
)

export const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb")
export const MPL_CORE_PROGRAM_ID = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d")

// ─── PDA helpers ──────────────────────────────────────────────────────────────

export function getConfigPda() {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID)[0]
}

export function getCoursePda(courseId: string) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("course"), Buffer.from(courseId)],
    PROGRAM_ID
  )[0]
}

export function getEnrollmentPda(courseId: string, learner: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()],
    PROGRAM_ID
  )[0]
}

export function getMinterRolePda(minter: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("minter"), minter.toBuffer()],
    PROGRAM_ID
  )[0]
}

export function deriveXpAta(owner: PublicKey, xpMint: PublicKey) {
  const ASSOCIATED_TOKEN_PROGRAM = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_2022_PROGRAM_ID.toBuffer(), xpMint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM
  )[0]
}
