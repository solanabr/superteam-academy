import type { Keypair } from "@solana/web3.js";
import type { WalletAdapter } from "./types";

/**
 * A keypair as a `WalletAdapter`, signing locally with no prompt.
 *
 * The secret stays inside the keypair: the adapter gives out signatures only.
 */
export function keypairSigner(keypair: Keypair): WalletAdapter {
  return {
    publicKey: keypair.publicKey,
    signTransaction: async (tx) => {
      tx.partialSign(keypair);
      return tx;
    },
    signAllTransactions: async (txs) => {
      for (const tx of txs) tx.partialSign(keypair);
      return txs;
    },
  };
}
