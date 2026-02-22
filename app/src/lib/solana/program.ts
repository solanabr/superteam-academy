import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import type { OnchainAcademy } from "./types";
import IDL from "./idl.json";

const connection = new Connection(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl("devnet"),
);

const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? "11111111111111111111111111111111",
);

// Read-only provider (no wallet needed for fetching accounts)
const readOnlyProvider = new AnchorProvider(
  connection,
  // Dummy wallet for read-only operations
  {
    publicKey: PublicKey.default,
    signAllTransactions: async (txs) => txs,
    signTransaction: async (tx) => tx,
  },
  { commitment: "confirmed" },
);

export const program = new Program<OnchainAcademy>(
  IDL as OnchainAcademy,
  readOnlyProvider,
);

export { connection, PROGRAM_ID };
