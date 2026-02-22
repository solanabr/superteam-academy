import "dotenv/config";
import { Keypair } from "@solana/web3.js";
import fs from "node:fs";
import bs58 from "bs58";

function loadKeypair(value: string): Keypair {
  const trimmed = value.trim();

  // File path
  if (trimmed.startsWith("/") || trimmed.startsWith(".") || trimmed.startsWith("~")) {
    const raw = fs.readFileSync(trimmed, "utf-8");
    const secretKey = Uint8Array.from(JSON.parse(raw));
    return Keypair.fromSecretKey(secretKey);
  }

  // JSON array string (e.g. from env var)
  if (trimmed.startsWith("[")) {
    const secretKey = Uint8Array.from(JSON.parse(trimmed));
    return Keypair.fromSecretKey(secretKey);
  }

  // Base58 encoded private key
  const secretKey = bs58.decode(trimmed);
  return Keypair.fromSecretKey(secretKey);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const config = {
  rpcUrl: requireEnv("SOLANA_RPC_URL"),
  backendSigner: loadKeypair(requireEnv("BACKEND_SIGNER_KEYPAIR")),
  authSecret: requireEnv("AUTH_SECRET"),
  port: parseInt(process.env.PORT || "3001", 10),
};
