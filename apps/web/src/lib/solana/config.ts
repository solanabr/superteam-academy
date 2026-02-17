import { PublicKey } from "@solana/web3.js";

export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
export const SOLANA_CLUSTER = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || "devnet";

export const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID
  ? new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID)
  : null;

export const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY;

export const USE_ONCHAIN = process.env.NEXT_PUBLIC_USE_ONCHAIN === "true";
