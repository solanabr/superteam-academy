/**
 * Server-side only — backend signer utilities for backend-signed instructions.
 */

import { Keypair, Connection, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { DEFAULT_RPC_URL } from "./constants";

/** Load the backend signer keypair from env. Supports base58 or JSON array format. */
export function loadBackendSigner(): Keypair {
  const key = process.env.BACKEND_SIGNER_PRIVATE_KEY;
  if (!key) throw new Error("BACKEND_SIGNER_PRIVATE_KEY not set");

  if (key.trimStart().startsWith("[")) {
    const arr = JSON.parse(key) as number[];
    return Keypair.fromSecretKey(Uint8Array.from(arr));
  }
  return Keypair.fromSecretKey(bs58.decode(key));
}

/**
 * Get the Metaplex Core track collection pubkey for a track, or null if not configured.
 * Prefers the CMS-stored collectionAddress if provided, falls back to TRACK_COLLECTION_N env var.
 */
export function getTrackCollectionPubkey(
  trackId: number,
  collectionAddress?: string,
): PublicKey | null {
  const key = collectionAddress || process.env[`TRACK_COLLECTION_${trackId}`];
  if (!key) return null;
  try {
    return new PublicKey(key);
  } catch {
    return null;
  }
}

/** Create a server-side Solana RPC connection. */
export function getServerConnection(): Connection {
  return new Connection(
    process.env.NEXT_PUBLIC_RPC_URL ?? DEFAULT_RPC_URL,
    "confirmed",
  );
}
