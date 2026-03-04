import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import type { OnchainAcademy } from "./idl/onchain_academy";
import idl from "./idl/onchain_academy.json";

const PROGRAM_ID = new PublicKey((idl as { address: string }).address);

export type AcademyProgram = Program<OnchainAcademy>;

/**
 * Create an Anchor Program instance backed by the connected wallet.
 * Returns null if wallet is not connected or doesn't support signing.
 */
export function getProgram(
  connection: Connection,
  wallet: WalletContextState,
): AcademyProgram | null {
  if (
    !wallet.publicKey ||
    !wallet.signTransaction ||
    !wallet.signAllTransactions
  )
    return null;

  const provider = new AnchorProvider(connection, {
    signTransaction: wallet.signTransaction.bind(wallet),
    signAllTransactions: wallet.signAllTransactions.bind(wallet),
    publicKey: wallet.publicKey,
  });

  return new Program(idl as OnchainAcademy, provider);
}

/**
 * Read-only Program instance for fetching accounts without a wallet.
 */
export function getProgramReadOnly(connection: Connection): AcademyProgram {
  const dummyKey = new PublicKey("11111111111111111111111111111111");
  const provider = new AnchorProvider(connection, {
    publicKey: dummyKey,
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs,
  });
  return new Program(idl as OnchainAcademy, provider);
}

export { PROGRAM_ID };
