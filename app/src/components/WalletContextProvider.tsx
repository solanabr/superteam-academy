"use client";

import React, { FC, ReactNode, useMemo, useEffect, useState } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

import "@solana/wallet-adapter-react-ui/styles.css";

const WALLET_ADAPTERS = [
  () => import("@solana/wallet-adapter-wallets").then((mod) => mod.PhantomWalletAdapter),
  () => import("@solana/wallet-adapter-wallets").then((mod) => mod.SolflareWalletAdapter),
];

export const WalletContextProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const [wallets, setWallets] = useState<any[]>([]);

  useEffect(() => {
    async function loadWallets() {
      const loadedWallets: any[] = [];
      for (const adapter of WALLET_ADAPTERS) {
        const WalletAdapter = await adapter();
        loadedWallets.push(new WalletAdapter());
      }
      setWallets(loadedWallets);
    }
    loadWallets();
  }, []);

  const memoizedWallets = useMemo(() => {
    const seen = new Set<string>();
    return wallets.filter((w) => {
      if (seen.has(w.name)) return false;
      seen.add(w.name);
      return true;
    });
  }, [wallets]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={memoizedWallets} autoConnect={false}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
