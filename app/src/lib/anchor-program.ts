/**
 * Shared Anchor program client utilities.
 *
 * Server-only (Node.js / Next.js API routes / scripts).
 * Use the WalletAdapter in the browser (EnrollButton uses it directly).
 *
 * Env var naming follows the deployment guide (DEPLOYING.md):
 *   NEXT_PUBLIC_PROGRAM_ID      — your deployed program ID
 *   NEXT_PUBLIC_XP_MINT         — XP token mint address
 *   BACKEND_SIGNER_KEYPAIR      — path to wallets/signer.json  (preferred)
 *   BACKEND_SIGNER_KEY          — base58 secret key            (alternative)
 *   ADMIN_SECRET_KEY            — same signer.json for devnet  (fallback)
 *
 * On devnet, authority = backend_signer = the same wallets/signer.json keypair.
 */

import "server-only"
import { Connection, Keypair, PublicKey } from "@solana/web3.js"
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor"
// Wallet is conditionally exported in the ESM build via a CJS `exports.Wallet = ...` pattern
// which webpack cannot statically analyze. Import directly from the CJS nodewallet module.
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet"
import bs58 from "bs58"
import fs from "fs"
import path from "path"

// ─── Program constants ────────────────────────────────────────────────────────

export const PROGRAM_ID = new PublicKey(
  // deployment guide uses NEXT_PUBLIC_PROGRAM_ID; fall back to NEXT_PUBLIC_SOLANA_PROGRAM_ID
  process.env.NEXT_PUBLIC_PROGRAM_ID ??
  process.env.NEXT_PUBLIC_SOLANA_PROGRAM_ID ??
  "ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf"
)
export const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb")
export const MPL_CORE_PROGRAM_ID = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d")

export function getRpcEndpoint() {
  return (
    process.env.ANCHOR_PROVIDER_URL ??
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
    "https://api.devnet.solana.com"
  )
}

export function getXpMintAddress() {
  const addr =
    process.env.NEXT_PUBLIC_XP_MINT ??        // deployment guide name
    process.env.NEXT_PUBLIC_SOLANA_XP_MINT    // our existing name

  if (!addr) {
    throw new Error(
      "NEXT_PUBLIC_XP_MINT (or NEXT_PUBLIC_SOLANA_XP_MINT) is not set.\n" +
        "Run: npm run onchain:xp-mint"
    )
  }
  return new PublicKey(addr)
}

// ─── Keypair loading — supports three formats ─────────────────────────────────
//
//  1. File path  → reads JSON array from disk  (wallets/signer.json)
//  2. JSON array → Uint8Array directly          ([1,2,3,...])
//  3. base58     → Phantom/CLI export format    ("5K7...")

export function loadKeypairFromValue(raw: string): Keypair {
  const trimmed = raw.trim()

  // Format 1: file path (starts with / ./ or ../)
  if (trimmed.startsWith("/") || trimmed.startsWith("./") || trimmed.startsWith("../")) {
    const resolved = path.resolve(process.cwd(), trimmed)
    if (!fs.existsSync(resolved)) {
      throw new Error(`Keypair file not found: ${resolved}`)
    }
    const bytes = Uint8Array.from(JSON.parse(fs.readFileSync(resolved, "utf8")) as number[])
    return Keypair.fromSecretKey(bytes)
  }

  // Format 2: JSON array string "[1,2,3,...]"
  if (trimmed.startsWith("[")) {
    try {
      const bytes = Uint8Array.from(JSON.parse(trimmed) as number[])
      return Keypair.fromSecretKey(bytes)
    } catch {
      throw new Error("Keypair value looks like a JSON array but could not be parsed.")
    }
  }

  // Format 3: base58
  try {
    return Keypair.fromSecretKey(bs58.decode(trimmed))
  } catch {
    throw new Error(
      "Keypair value is not a valid file path, JSON array, or base58 string.\n" +
        "Expected one of:\n" +
        "  ../wallets/signer.json   (file path)\n" +
        "  [1,2,3,...]              (JSON array)\n" +
        "  5K7jX...                 (base58)"
    )
  }
}

export function keypairFromEnv(envVar: string): Keypair {
  const raw = process.env[envVar]
  if (!raw) throw new Error(`${envVar} is not set.`)
  return loadKeypairFromValue(raw)
}

/**
 * Load the backend signer.
 * On devnet this is wallets/signer.json — the same as the admin.
 *
 * Checks env vars in priority order:
 *   BACKEND_SIGNER_KEYPAIR  → file path (deployment guide format)
 *   BACKEND_SIGNER_KEY      → base58 / JSON array (our format)
 *   ADMIN_SECRET_KEY        → fallback (same key on devnet)
 *   ANCHOR_WALLET           → Anchor CLI env var (also a file path)
 */
export function getBackendSigner(): Keypair {
  for (const envVar of ["BACKEND_SIGNER_KEYPAIR", "BACKEND_SIGNER_KEY", "ADMIN_SECRET_KEY", "ANCHOR_WALLET"]) {
    const val = process.env[envVar]
    if (val) {
      try {
        return loadKeypairFromValue(val)
      } catch {
        // try next
      }
    }
  }
  throw new Error(
    "No backend signer key found. Set one of:\n" +
      "  BACKEND_SIGNER_KEYPAIR=../wallets/signer.json\n" +
      "  BACKEND_SIGNER_KEY=<base58>\n" +
      "  ADMIN_SECRET_KEY=<base58>"
  )
}

/**
 * Load the admin/authority signer.
 * On devnet this is the same wallets/signer.json used to deploy the program.
 */
export function getAdminSigner(): Keypair {
  for (const envVar of ["ADMIN_SECRET_KEY", "BACKEND_SIGNER_KEYPAIR", "ANCHOR_WALLET"]) {
    const val = process.env[envVar]
    if (val) {
      try {
        return loadKeypairFromValue(val)
      } catch {
        // try next
      }
    }
  }
  throw new Error(
    "No admin signer key found. Set one of:\n" +
      "  ADMIN_SECRET_KEY=<base58>\n" +
      "  BACKEND_SIGNER_KEYPAIR=../wallets/signer.json\n" +
      "  ANCHOR_WALLET=../wallets/signer.json"
  )
}

// ─── Anchor provider ─────────────────────────────────────────────────────────

export function makeProvider(keypair: Keypair): AnchorProvider {
  const connection = new Connection(getRpcEndpoint(), "confirmed")
  const wallet = new NodeWallet(keypair)
  return new AnchorProvider(connection, wallet, { commitment: "confirmed" })
}

let _cachedIdl: Idl | null = null

/**
 * Fetch the IDL from the on-chain IDL account (written by `anchor deploy`).
 * Cached in memory after the first fetch.
 */
export async function fetchProgramIdl(provider: AnchorProvider): Promise<Idl> {
  if (_cachedIdl) return _cachedIdl
  const idl = await Program.fetchIdl(PROGRAM_ID, provider)
  if (!idl) {
    throw new Error(
      `Could not fetch IDL for program ${PROGRAM_ID.toBase58()}.\n` +
        "After deploying, Anchor auto-uploads the IDL. If this fails:\n" +
        "  1. Run: anchor idl init --filepath target/idl/onchain_academy.json <PROGRAM_ID> --provider.cluster devnet\n" +
        "  2. Or copy target/idl/onchain_academy.json into src/lib/ and import it directly."
    )
  }
  _cachedIdl = idl
  return idl
}

/**
 * Returns an Anchor Program client signed by the given keypair.
 */
export async function getProgram(signer: Keypair): Promise<Program> {
  const provider = makeProvider(signer)
  const idl = await fetchProgramIdl(provider)
  // Anchor v0.30+: program ID is embedded in the IDL — pass only provider
  return new Program(idl, provider)
}

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

// ─── Token-2022 ATA ───────────────────────────────────────────────────────────

export function deriveXpAta(owner: PublicKey, xpMint: PublicKey) {
  const ASSOCIATED_TOKEN_PROGRAM = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_2022_PROGRAM_ID.toBuffer(), xpMint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM
  )[0]
}
