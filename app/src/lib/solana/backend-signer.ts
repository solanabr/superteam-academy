import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

let _keypair: Keypair | null = null;

export function getBackendKeypair(): Keypair {
  if (_keypair) return _keypair;

  const key = process.env.BACKEND_SIGNER_KEY;
  if (!key) {
    throw new Error("BACKEND_SIGNER_KEY environment variable is not set");
  }

  try {
    const bytes = bs58.decode(key);
    _keypair = Keypair.fromSecretKey(bytes);
  } catch {
    const bytes = Uint8Array.from(JSON.parse(key));
    _keypair = Keypair.fromSecretKey(bytes);
  }

  return _keypair;
}
