"use client";

import { useCallback, useMemo, type ReactNode } from "react";
import type { WalletError } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import { WalletAuthHandler } from "@/components/auth/wallet-auth-handler";

import "@solana/wallet-adapter-react-ui/styles.css";

interface SolanaWalletProviderProps {
  children: ReactNode;
}

export function SolanaWalletProvider({ children }: SolanaWalletProviderProps) {
  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl("devnet"),
    []
  );

  // Wallet Standard auto-discovers installed wallets (Phantom, Solflare,
  // Backpack, MetaMask Snap, etc.)
  const wallets = useMemo(() => [], []);

  // autoConnect=true lets the adapter reconnect a previously-selected wallet
  // AND — critically — triggers connect() after the WalletModal calls select().
  // With autoConnect=false the modal can select a wallet but never connects it.
  //
  // The old "Nonce already used" race conditions are now mitigated server-side:
  //   • Server-issued nonces (/api/auth/nonce) — no client duplicates
  //   • Split check/consume — failed validations don't burn nonces
  //   • hasTriedAuth ref in WalletAuthHandler — prevents double SIWS per mount
  //   • "if (user) return" guard — skips SIWS when already logged in
  const autoConnect = true;

  const onError = useCallback((error: WalletError) => {
    console.error("[wallet]", error.name, error.message);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider
        wallets={wallets}
        autoConnect={autoConnect}
        onError={onError}
      >
        <WalletModalProvider>
          <WalletAuthHandler />
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
