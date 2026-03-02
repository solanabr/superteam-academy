"use client";

import * as React from "react";
import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl, type Cluster } from "@solana/web3.js";

// Dynamically import wallet adapter styles to avoid SSR issues
const importWalletStyles = () => {
  if (typeof window !== "undefined") {
    import("@solana/wallet-adapter-react-ui/styles.css").catch(() => {
      // Styles already loaded or unavailable — safe to ignore
    });
  }
};

const NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet") as Cluster;

interface SolanaWalletProviderProps {
  children: React.ReactNode;
}

export function SolanaWalletProvider({ children }: SolanaWalletProviderProps) {
  React.useEffect(() => {
    importWalletStyles();
  }, []);

  const endpoint = useMemo(() => clusterApiUrl(NETWORK), []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      // BackpackWalletAdapter is detected via wallet-standard — no explicit adapter needed
      new TorusWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
