import {
  Keypair,
  Connection,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { Program, AnchorProvider, type Idl } from "@coral-xyz/anchor";
import IDL_JSON from "./idl/onchain_academy.json";
import { HELIUS_RPC_URL } from "@/lib/constants";

/** Minimal wallet adapter for server-side Anchor usage (no browser wallet). */
class NodeWallet {
  constructor(readonly payer: Keypair) {}

  get publicKey() {
    return this.payer.publicKey;
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(
    tx: T,
  ): Promise<T> {
    if (tx instanceof Transaction) {
      tx.partialSign(this.payer);
    }
    return tx;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    txs: T[],
  ): Promise<T[]> {
    for (const tx of txs) {
      if (tx instanceof Transaction) {
        tx.partialSign(this.payer);
      }
    }
    return txs;
  }
}

export function getBackendSigner(): Keypair {
  const key = process.env.BACKEND_SIGNER_KEY;
  if (!key) throw new Error("BACKEND_SIGNER_KEY not configured");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(key)));
}

export function getBackendProgram(): {
  program: Program;
  signer: Keypair;
  connection: Connection;
} {
  const signer = getBackendSigner();
  const connection = new Connection(HELIUS_RPC_URL, "confirmed");
  const wallet = new NodeWallet(signer);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const program = new Program(IDL_JSON as Idl, provider);
  return { program, signer, connection };
}
