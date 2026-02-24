"use client";

import { type ReactNode, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { CLIENT_RPC_URL } from "@/lib/constants";

import "@solana/wallet-adapter-react-ui/styles.css";

export function WalletProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => CLIENT_RPC_URL, []);
  // Wallet Standard auto-detects installed wallets (Phantom, Solflare, Backpack, etc.)
  // No manual adapter imports needed with @solana/wallet-adapter v0.9+
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
