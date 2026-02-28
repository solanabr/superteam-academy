import { AnchorProvider, Idl, Program, Wallet } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { getConnection } from "./connection";
import IDL from "./idl/superteam_academy.json";

// Cast IDL as any to bypass strict Anchor type inference from JSON imports.
// The runtime type checking is handled by Anchor's Program constructor.
const IDL_TYPED = IDL as any as Idl;

export function getProgram(provider: AnchorProvider): Program {
  return new Program(IDL_TYPED, provider);
}

export function getReadonlyProgram(): Program {
  const connection = getConnection();
  const dummyWallet = {
    publicKey: PublicKey.default,
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs,
  } as Wallet;
  const provider = new AnchorProvider(connection, dummyWallet, {
    commitment: "confirmed",
  });
  return new Program(IDL_TYPED, provider);
}

export function getBackendProgram(backendKeypair: Keypair): Program {
  const connection = getConnection();
  const wallet = {
    publicKey: backendKeypair.publicKey,
    signTransaction: async (tx: any) => {
      tx.partialSign(backendKeypair);
      return tx;
    },
    signAllTransactions: async (txs: any[]) => {
      txs.forEach((tx: any) => tx.partialSign(backendKeypair));
      return txs;
    },
    payer: backendKeypair,
  } as unknown as Wallet;
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new Program(IDL_TYPED, provider);
}
