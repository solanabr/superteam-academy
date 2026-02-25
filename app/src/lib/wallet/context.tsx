"use client";

import { createContext, useContext } from "react";
import type { PublicKey, Connection, Transaction, VersionedTransaction, TransactionSignature, SendOptions } from "@solana/web3.js";
import type { WalletReadyState } from "@solana/wallet-adapter-base";

/**
 * Lightweight wallet context that mirrors @solana/wallet-adapter-react's
 * WalletContextState. Only TYPE imports are used — zero runtime cost,
 * so this module stays in the main bundle without pulling in heavy wallet JS.
 *
 * The real wallet provider lazily bridges adapter state into this context.
 * Until then, consumers get safe defaults (disconnected / null pubkey).
 */

export interface Wallet {
  adapter: { name: string; icon: string };
  readyState: WalletReadyState;
}

type SendTransactionFn = (
  transaction: Transaction | VersionedTransaction,
  connection: Connection,
  options?: SendOptions,
) => Promise<TransactionSignature>;

type SignTransactionFn = (
  transaction: Transaction | VersionedTransaction,
) => Promise<Transaction | VersionedTransaction>;

type SignAllTransactionsFn = (
  transactions: (Transaction | VersionedTransaction)[],
) => Promise<(Transaction | VersionedTransaction)[]>;

type SignMessageFn = (message: Uint8Array) => Promise<Uint8Array>;

export interface WalletContextState {
  connected: boolean;
  connecting: boolean;
  disconnecting: boolean;
  publicKey: PublicKey | null;
  wallet: Wallet | null;
  wallets: Wallet[];
  select: (walletName: string | null) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendTransaction: SendTransactionFn | undefined;
  signTransaction: SignTransactionFn | undefined;
  signAllTransactions: SignAllTransactionsFn | undefined;
  signMessage: SignMessageFn | undefined;
}

const WALLET_DEFAULTS: WalletContextState = {
  connected: false,
  connecting: false,
  disconnecting: false,
  publicKey: null,
  wallet: null,
  wallets: [],
  select: () => {},
  connect: async () => {},
  disconnect: async () => {},
  sendTransaction: undefined,
  signTransaction: undefined,
  signAllTransactions: undefined,
  signMessage: undefined,
};

export const WalletBridgeContext =
  createContext<WalletContextState>(WALLET_DEFAULTS);

/**
 * Drop-in replacement for `useWallet()` from @solana/wallet-adapter-react.
 * Returns safe defaults while the wallet provider is loading asynchronously.
 */
export function useWallet(): WalletContextState {
  return useContext(WalletBridgeContext);
}
