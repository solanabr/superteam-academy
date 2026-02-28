import { Connection, PublicKey } from "@solana/web3.js";
import { DEFAULT_RPC_URL } from "./constants";

/**
 * Create a Solana RPC connection with "confirmed" commitment level.
 * Defaults to the devnet RPC endpoint configured in environment variables.
 * @param rpcUrl - Optional custom RPC endpoint URL (overrides default)
 * @returns Configured Solana Connection instance
 */
export function getConnection(rpcUrl?: string): Connection {
  return new Connection(rpcUrl || DEFAULT_RPC_URL, "confirmed");
}

// Re-export for convenience
export { PROGRAM_ID } from "./constants";
export { PublicKey };
