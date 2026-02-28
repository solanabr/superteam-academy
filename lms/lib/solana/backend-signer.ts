import { Keypair } from "@solana/web3.js";

let cachedKeypair: Keypair | null = null;

export function getBackendSigner(): Keypair {
  if (cachedKeypair) return cachedKeypair;

  const raw = process.env.BACKEND_SIGNER_PRIVATE_KEY;
  if (!raw) {
    throw new Error("BACKEND_SIGNER_PRIVATE_KEY env var not set");
  }

  let secretKey: Uint8Array;

  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    // JSON array format: [1,2,3,...]
    const arr: number[] = JSON.parse(trimmed);
    secretKey = Uint8Array.from(arr);
  } else {
    // Base58 format
    const bs58 = require("bs58");
    secretKey = bs58.decode(trimmed);
  }

  cachedKeypair = Keypair.fromSecretKey(secretKey);
  return cachedKeypair;
}
