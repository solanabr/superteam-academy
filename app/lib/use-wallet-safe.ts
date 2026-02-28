'use client';

import { useWallet } from '@solana/wallet-adapter-react';

const EMPTY_WALLET = {
  connected: false,
  connecting: false,
  disconnecting: false,
  publicKey: null,
  wallet: null,
  wallets: [] as never[],
  select: (() => {}) as never,
  connect: (async () => {}) as never,
  disconnect: (async () => {}) as never,
  sendTransaction: (async () => { throw new Error('Wallet not ready'); }) as never,
  signTransaction: undefined,
  signAllTransactions: undefined,
  signMessage: undefined,
};

/** Safe wrapper around useWallet that returns defaults when WalletContext is not yet available */
export function useWalletSafe() {
  try {
    return useWallet();
  } catch {
    return EMPTY_WALLET;
  }
}
