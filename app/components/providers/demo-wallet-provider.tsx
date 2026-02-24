"use client";

import { useMemo, useState } from "react";
import { Keypair } from "@solana/web3.js";
import { ConnectionProvider } from "@solana/wallet-adapter-react";
import { WalletContext } from "@solana/wallet-adapter-react";
import { WalletModalContext } from "@solana/wallet-adapter-react-ui";
import { HELIUS_URL } from "@/lib/constants";

import "@solana/wallet-adapter-react-ui/styles.css";

const DEMO_KEYPAIR = Keypair.fromSeed(new Uint8Array(32).fill(42));

export function DemoWalletProvider({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => HELIUS_URL, []);
  const [visible, setVisible] = useState(false);

  const walletContextValue = useMemo(
    () => ({
      autoConnect: true,
      wallets: [],
      wallet: null,
      publicKey: DEMO_KEYPAIR.publicKey,
      connecting: false,
      connected: true,
      disconnecting: false,
      select: () => {},
      connect: async () => {},
      disconnect: async () => {},
      sendTransaction: () => {
        throw new Error("Demo mode: sendTransaction not available");
      },
      signTransaction: async <T,>(tx: T): Promise<T> => tx,
      signAllTransactions: async <T,>(txs: T[]): Promise<T[]> => txs,
      signMessage: async () => new Uint8Array(),
      signIn: undefined,
    }),
    []
  );

  const modalContextValue = useMemo(() => ({ visible, setVisible }), [visible]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletContext.Provider value={walletContextValue}>
        <WalletModalContext.Provider value={modalContextValue}>
          {children}
        </WalletModalContext.Provider>
      </WalletContext.Provider>
    </ConnectionProvider>
  );
}
