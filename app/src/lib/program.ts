import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import type { OnchainAcademy } from "./onchain_academy";
import IDL from "./idl.json";

// Program addresses from env
export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ??
    "D8K3tYKbD7cV6aNo8hpqrRY9EdVUefyj2H36B78NkCFc",
);
export const XP_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_XP_MINT ??
    "CCymry7J61kL2VgaRzGsAuzyUE14L7ccotqPrPAPXpU6",
);
export const BACKEND_SIGNER = new PublicKey(
  process.env.NEXT_PUBLIC_BACKEND_SIGNER ??
    "AsbHQF8Ubi7U29H9wXvphbtSCJr7svuaMtY1H5n7fn2A",
);

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC ?? "https://api.devnet.solana.com";

// Shared read-only connection (no wallet needed for reads)
let _connection: Connection | null = null;
export function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(RPC_URL, "confirmed");
  }
  return _connection;
}

// Read-only program instance (for fetching accounts without a wallet)
let _readProgram: Program<OnchainAcademy> | null = null;
export function getReadProgram(): Program<OnchainAcademy> {
  if (!_readProgram) {
    const connection = getConnection();
    // @ts-expect-error -- read-only provider without wallet
    const provider = new AnchorProvider(
      connection,
      {},
      { commitment: "confirmed" },
    );
    _readProgram = new Program(IDL as OnchainAcademy, provider);
  }
  return _readProgram;
}

// Program instance with a wallet provider (for sending transactions)
export function getProgram(provider: AnchorProvider): Program<OnchainAcademy> {
  return new Program(IDL as OnchainAcademy, provider);
}

// --- PDA Derivation Helpers ---

export function findConfigPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
}

export function findCoursePda(courseId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("course"), Buffer.from(courseId)],
    PROGRAM_ID,
  );
}

export function findEnrollmentPda(
  courseId: string,
  learner: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()],
    PROGRAM_ID,
  );
}

export function findMinterRolePda(minter: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("minter"), minter.toBuffer()],
    PROGRAM_ID,
  );
}

export function findAchievementTypePda(
  achievementId: string,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("achievement"), Buffer.from(achievementId)],
    PROGRAM_ID,
  );
}

export function findAchievementReceiptPda(
  achievementId: string,
  recipient: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("achievement_receipt"),
      Buffer.from(achievementId),
      recipient.toBuffer(),
    ],
    PROGRAM_ID,
  );
}
