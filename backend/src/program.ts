import type { Idl } from "@coral-xyz/anchor";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import idl from "./idl/onchain_academy.json" with { type: "json" };

const rpc =
  process.env.SOLANA_RPC ?? "https://api.devnet.solana.com";

function getKeypair(envKey: string): Keypair | null {
  const raw = process.env[envKey];
  if (!raw) return null;
  try {
    const arr = JSON.parse(raw) as number[];
    return Keypair.fromSecretKey(Uint8Array.from(arr));
  } catch {
    return null;
  }
}

function walletFromKeypair(keypair: Keypair) {
  return {
    publicKey: keypair.publicKey,
    signTransaction: async <T extends Transaction | VersionedTransaction>(
      tx: T
    ): Promise<T> => {
      if (tx instanceof VersionedTransaction) {
        tx.sign([keypair]);
      } else {
        tx.sign(keypair);
      }
      return tx;
    },
    signAllTransactions: async <T extends Transaction | VersionedTransaction>(
      txs: T[]
    ): Promise<T[]> => {
      txs.forEach((tx) => {
        if (tx instanceof VersionedTransaction) tx.sign([keypair]);
        else tx.sign(keypair);
      });
      return txs;
    },
  };
}

export function getAuthorityKeypair(): Keypair | null {
  return getKeypair("ACADEMY_AUTHORITY_KEYPAIR");
}

export function getBackendSignerKeypair(): Keypair | null {
  return getKeypair("ACADEMY_BACKEND_SIGNER_KEYPAIR");
}

export function getAuthorityProgram(): Program | null {
  const keypair = getAuthorityKeypair();
  if (!keypair) return null;
  const connection = new Connection(rpc);
  const wallet = walletFromKeypair(keypair);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new Program(idl as Idl, provider);
}

export function getBackendProgram(): Program | null {
  const keypair = getKeypair("ACADEMY_BACKEND_SIGNER_KEYPAIR");
  if (!keypair) return null;
  const connection = new Connection(rpc);
  const wallet = walletFromKeypair(keypair);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new Program(idl as Idl, provider);
}
