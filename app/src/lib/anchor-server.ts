import { Program, AnchorProvider } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { IDL } from "./idl";
import {
  PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  MPL_CORE_PROGRAM_ID,
  getConnectionEndpoint,
} from "./solana";

export { PROGRAM_ID, TOKEN_2022_PROGRAM_ID, MPL_CORE_PROGRAM_ID };

// ─── Keypair ──────────────────────────────────────────────────────────────────

export function loadBackendKeypair(): Keypair {
  const raw = process.env.BACKEND_KEYPAIR;
  if (!raw) throw new Error("BACKEND_KEYPAIR env var not set");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw) as number[]));
}

// ─── XP Mint ─────────────────────────────────────────────────────────────────

export function getXpMintPubkey(): PublicKey {
  const raw = process.env.NEXT_PUBLIC_XP_MINT;
  if (!raw) throw new Error("NEXT_PUBLIC_XP_MINT env var not set");
  return new PublicKey(raw);
}

// ─── Track collections ────────────────────────────────────────────────────────

export function getTrackCollection(trackId: number): PublicKey | null {
  const raw = process.env.NEXT_PUBLIC_TRACK_COLLECTIONS ?? "";
  const addrs = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const addr = addrs[trackId - 1];
  if (!addr) return null;
  try {
    return new PublicKey(addr);
  } catch {
    return null;
  }
}

// ─── Achievement collections ──────────────────────────────────────────────────

export function getAchievementCollection(
  achievementId: string,
): PublicKey | null {
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

export function getCredentialMeta(
  trackId: number,
  coursesCompleted: number,
  totalXp: number,
): { name: string; uri: string; coursesCompleted: number; totalXp: number } {
  const uri =
    process.env[`TRACK_URI_${trackId}`] ??
    `https://arweave.net/placeholder-track-${trackId}`;
  return {
    name: TRACK_NAMES[trackId - 1] ?? `Track ${trackId} Developer`,
    uri,
    coursesCompleted,
    totalXp,
  };
}

// ─── Program factory ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AcademyProgram = Program<any>;

export function getAnchorProgram(): {
  program: AcademyProgram;
  backendKeypair: Keypair;
  connection: Connection;
} {
  const backendKeypair = loadBackendKeypair();
  const connection = new Connection(getConnectionEndpoint(), "confirmed");

  // Inline wallet — avoids importing `Wallet` which is absent in Anchor's ESM build
  const wallet = {
    publicKey: backendKeypair.publicKey,
    signTransaction: async <T extends Transaction | VersionedTransaction>(
      tx: T,
    ): Promise<T> => {
      if ("version" in tx) {
        (tx as VersionedTransaction).sign([backendKeypair]);
      } else {
        (tx as Transaction).sign(backendKeypair);
      }
      return tx;
    },
    signAllTransactions: async <T extends Transaction | VersionedTransaction>(
      txs: T[],
    ): Promise<T[]> => {
      txs.forEach((tx) => {
        if ("version" in tx) {
          (tx as VersionedTransaction).sign([backendKeypair]);
        } else {
          (tx as Transaction).sign(backendKeypair);
        }
      });
      return txs;
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const provider = new AnchorProvider(connection, wallet as any, {
    commitment: "confirmed",
    skipPreflight: false,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const program = new Program(IDL as any, provider) as AcademyProgram;
  return { program, backendKeypair, connection };
}

// ─── ATA helper ───────────────────────────────────────────────────────────────

/** Ensure a Token-2022 ATA exists, creating it on-chain if necessary. */
export async function ensureXpAta(
  connection: Connection,
  payer: Keypair,
  owner: PublicKey,
  mint: PublicKey,
): Promise<PublicKey> {
  const ata = getAssociatedTokenAddressSync(
    mint,
    owner,
    false,
    TOKEN_2022_PROGRAM_ID,
  );
  const info = await connection.getAccountInfo(ata);
  if (info) return ata;

  const ix = createAssociatedTokenAccountInstruction(
    payer.publicKey,
    ata,
    owner,
    mint,
    TOKEN_2022_PROGRAM_ID,
  );
  const tx = new Transaction().add(ix);
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = payer.publicKey;
  tx.sign(payer);
  const sig = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction(
    { signature: sig, blockhash, lastValidBlockHeight },
    "confirmed",
  );
  return ata;
}

// ─── Error serializer ─────────────────────────────────────────────────────────

export function serializeAnchorError(err: unknown): string {
  if (err instanceof Error) {
    const logs = (err as unknown as { logs?: string[] }).logs;
    if (logs?.length) return `${err.message}\n${logs.join("\n")}`;
    return err.message;
  }
  return String(err);
}
