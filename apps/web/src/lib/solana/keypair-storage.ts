import { Keypair } from "@solana/web3.js";

/**
 * Store a Keypair as a JSON-encoded byte array in localStorage.
 *
 * WARNING: This stores private keys in localStorage. Only use for
 * devnet keypairs in educational contexts. NEVER use for mainnet.
 */
export function saveKeypair(key: string, kp: Keypair): void {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(kp.secretKey)));
  } catch {
    // non-critical
  }
}

/**
 * Load a Keypair from localStorage.
 */
export function loadKeypair(key: string): Keypair | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const arr = JSON.parse(raw) as number[];
    return Keypair.fromSecretKey(Uint8Array.from(arr));
  } catch {
    return null;
  }
}
