// app/src/lib/server.ts
import { Connection, Keypair } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import fs from "fs";
import path from "path";

import idl from "@/lib/idl/onchain_academy.json";
import type { OnchainAcademy } from "@/types/onchain_academy";

// ──────────────────────────────────────────────
// RPC (Helius в приоритете)
// ──────────────────────────────────────────────
export const connection = new Connection(
  process.env.HELIUS_RPC ||
    (process.env.NEXT_PUBLIC_CLUSTER === "devnet"
      ? "https://api.devnet.solana.com"
      : "https://api.mainnet-beta.solana.com"),
  "confirmed"
);

// ──────────────────────────────────────────────
// Кастомный Backend Wallet (работает на Anchor 0.32+)
// ──────────────────────────────────────────────
class BackendWallet {
  constructor(readonly payer: Keypair) {}

  get publicKey() {
    return this.payer.publicKey;
  }

  async signTransaction(tx: any) {
    tx.partialSign(this.payer);
    return tx;
  }

  async signAllTransactions(txs: any[]) {
    txs.forEach((tx) => tx.partialSign(this.payer));
    return txs;
  }
}

const loadBackendWallet = () => {
  try {
    const keyPath = process.env.BACKEND_SIGNER_KEYPAIR;

    if (!keyPath) {
      throw new Error("BACKEND_SIGNER_KEYPAIR not set in .env.local");
    }

    const fullPath = path.resolve(process.cwd(), keyPath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Keypair file not found: ${fullPath}`);
    }

    const secretKey = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
    const keypair = Keypair.fromSecretKey(new Uint8Array(secretKey));

    return new BackendWallet(keypair);
  } catch (error: any) {
    console.error("Failed to load backend wallet:", error);
    throw new Error(`Backend wallet configuration error: ${error.message}`);
  }
};

// ──────────────────────────────────────────────
// Основные экспорты
// ──────────────────────────────────────────────
export const getServerProgram = () => {
  const wallet = loadBackendWallet();

  const provider = new AnchorProvider(connection, wallet as any, {
    commitment: "confirmed",
  });

  // @ts-ignore
  return new Program<OnchainAcademy>(idl, provider);
};

export const getBackendWallet = () => loadBackendWallet();