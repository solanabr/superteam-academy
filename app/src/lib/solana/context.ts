/**
 * Client-side Solana context for on-chain integration.
 * Set by SolanaContextBridge when ConnectionProvider is ready.
 */

import type { Connection } from "@solana/web3.js";
import type { PublicKey } from "@solana/web3.js";

export interface SolanaContext {
  connection: Connection | null;
  xpMint: PublicKey | null;
  heliusUrl: string | null;
}

let context: SolanaContext = {
  connection: null,
  xpMint: null,
  heliusUrl: null,
};

export function setSolanaContext(
  connection: Connection | null,
  xpMint: PublicKey | null,
  heliusUrl: string | null
): void {
  context = { connection, xpMint, heliusUrl };
}

export function getSolanaContext(): SolanaContext {
  return context;
}
