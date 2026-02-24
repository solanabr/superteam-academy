import { Connection, Keypair, PublicKey } from "@solana/web3.js";

export const TOKEN_2022 = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
export const MPL_CORE = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

export function getBackendSigner(): Keypair {
  const key = process.env.BACKEND_SIGNER_KEY;
  if (!key || key === "[]") throw new Error("BACKEND_SIGNER_KEY not configured");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(key)));
}

export function getConnection(): Connection {
  return new Connection(
    process.env.HELIUS_URL || "https://api.devnet.solana.com",
    "confirmed"
  );
}

export function getProgramId(): PublicKey {
  return new PublicKey(
    process.env.PROGRAM_ID || "ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf"
  );
}

export function getXpMint(): PublicKey {
  return new PublicKey(
    process.env.XP_MINT || "xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3"
  );
}

export function getTrackCollection(): PublicKey | null {
  const addr = process.env.TRACK_COLLECTION;
  if (!addr) return null;
  return new PublicKey(addr);
}
