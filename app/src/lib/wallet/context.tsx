"use client";

import { createContext, useContext } from "react";

/**
 * Lightweight wallet context that mirrors @solana/wallet-adapter-react's
 * WalletContextState. This module has ZERO runtime imports from the adapter,
 * so it can live in the main bundle without pulling in the heavy wallet JS.
 *
 * The real wallet provider lazily bridges adapter state into this context.
 * Until then, consumers get safe defaults (disconnected / null pubkey).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface WalletContextState {
  connected: boolean;
  connecting: boolean;
  disconnecting: boolean;
  publicKey: any;
  wallet: any;
  wallets: any[];
  select: (walletName: any) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendTransaction: any;
  signTransaction: any;
  signAllTransactions: any;
  signMessage: any;
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
