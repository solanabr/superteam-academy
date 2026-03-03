import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import IDL from "./onchain_academy.json";

// ─── Constants ────────────────────────────────────────────────────────────────

export const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID ?? "64XGGSc32TUX7rxge5u4Qsv55RQN5ybSwS4B1eksWTxy"
);

export const TOKEN_2022_PROGRAM_ID = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);

export const MPL_CORE_PROGRAM_ID = new PublicKey(
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
);

// ─── Track collections ────────────────────────────────────────────────────────

/** Returns the Metaplex Core collection pubkey for a given trackId (1-indexed). */
export function getTrackCollection(trackId: number): PublicKey | null {
  const raw = process.env.TRACK_COLLECTIONS ?? "";
  const addrs = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const addr = addrs[trackId - 1];
  if (!addr) return null;
  try {
    return new PublicKey(addr);
  } catch {
    return null;
  }
}

// ─── Achievement collections ──────────────────────────────────────────────────

/** Returns the Metaplex Core collection pubkey for a given achievementId.
 *  Env var format: ACHIEVEMENT_FIRST_LESSON, ACHIEVEMENT_XP_100, etc. */
export function getAchievementCollection(achievementId: string): PublicKey | null {
  const envKey = `ACHIEVEMENT_${achievementId.toUpperCase().replace(/-/g, "_")}`;
  const addr = process.env[envKey];
  if (!addr) return null;
  try {
    return new PublicKey(addr);
  } catch {
    return null;
  }
}

// ─── Credential metadata ──────────────────────────────────────────────────────

const TRACK_NAMES = [
  "Solana Basics Developer",
  "Anchor Framework Developer",
  "DeFi & AMMs Developer",
  "NFTs & Digital Assets Developer",
  "Full-Stack Solana Developer",
];

const TRACK_URIS = [
  process.env.TRACK_URI_1 ?? "https://arweave.net/placeholder-solana-basics",
  process.env.TRACK_URI_2 ?? "https://arweave.net/placeholder-anchor",
  process.env.TRACK_URI_3 ?? "https://arweave.net/placeholder-defi",
  process.env.TRACK_URI_4 ?? "https://arweave.net/placeholder-nfts",
  process.env.TRACK_URI_5 ?? "https://arweave.net/placeholder-fullstack",
];

export function getCredentialMeta(
  trackId: number,
  coursesCompleted: number,
  totalXp: number
): { name: string; uri: string; coursesCompleted: number; totalXp: number } {
  return {
    name: TRACK_NAMES[trackId - 1] ?? `Track ${trackId} Developer`,
    uri: TRACK_URIS[trackId - 1] ?? "https://arweave.net/placeholder",
    coursesCompleted,
    totalXp,
  };
}

// ─── Keypair ──────────────────────────────────────────────────────────────────

export function loadBackendKeypair(): Keypair {
  const raw = process.env.BACKEND_KEYPAIR;
  if (!raw) throw new Error("BACKEND_KEYPAIR env var not set");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw) as number[]));
}

// ─── XP mint ─────────────────────────────────────────────────────────────────

export function getXpMint(): PublicKey {
  const raw = process.env.XP_MINT;
  if (!raw) throw new Error("XP_MINT env var not set");
  return new PublicKey(raw);
}

// ─── Program factory ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AcademyProgram = Program<any>;

export function getProgram(): {
  program: AcademyProgram;
  backendKeypair: Keypair;
  connection: Connection;
} {
  const rpcUrl = process.env.RPC_URL ?? "https://api.devnet.solana.com";
  const backendKeypair = loadBackendKeypair();
  const connection = new Connection(rpcUrl, "confirmed");
  const wallet = new Wallet(backendKeypair);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    skipPreflight: false,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const program = new Program(IDL as any, provider) as AcademyProgram;
  return { program, backendKeypair, connection };
}
