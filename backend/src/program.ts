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

const keypairCache = new Map<string, Keypair | null>();
let authorityProgramCache: Program | null | undefined;
let backendProgramCache: Program | null | undefined;

function getKeypair(envKey: string): Keypair | null {
  const cached = keypairCache.get(envKey);
  if (cached !== undefined) {
    return cached;
  }

  const raw = process.env[envKey];
  if (!raw) {
    keypairCache.set(envKey, null);
    return null;
  }

  try {
    const arr = JSON.parse(raw) as number[];
    const keypair = Keypair.fromSecretKey(Uint8Array.from(arr));
    keypairCache.set(envKey, keypair);
    return keypair;
  } catch {
    keypairCache.set(envKey, null);
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

function createProgram(keypair: Keypair): Program {
  const connection = new Connection(rpc);
  const wallet = walletFromKeypair(keypair);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new Program(idl as Idl, provider);
}

export function getAuthorityProgram(): Program | null {
  if (authorityProgramCache !== undefined) {
    return authorityProgramCache;
  }

  const keypair = getAuthorityKeypair();
  authorityProgramCache = keypair ? createProgram(keypair) : null;
  return authorityProgramCache;
}

export function getBackendProgram(): Program | null {
  if (backendProgramCache !== undefined) {
    return backendProgramCache;
  }

  const keypair = getBackendSignerKeypair();
  backendProgramCache = keypair ? createProgram(keypair) : null;
  return backendProgramCache;
}
