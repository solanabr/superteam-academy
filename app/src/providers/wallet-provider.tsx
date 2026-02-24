"use client";

import { type ReactNode, useMemo, useEffect, useRef } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { HELIUS_RPC_URL } from "@/lib/constants";
import { analytics } from "@/providers/analytics-provider";

import "@solana/wallet-adapter-react-ui/styles.css";

function WalletEventTracker({ children }: { children: ReactNode }) {
  const { connected, wallet } = useWallet();
  const prevConnected = useRef(false);

  useEffect(() => {
    if (connected && !prevConnected.current && wallet?.adapter.name) {
      analytics.walletConnected(wallet.adapter.name);
    }
    prevConnected.current = connected;
  }, [connected, wallet]);

  return <>{children}</>;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => {
    // During SSR, use the server-side RPC URL (needs absolute URL).
    // On the client, use the /api/rpc proxy to hide the API key.
    if (typeof window === "undefined") return HELIUS_RPC_URL;
    return `${window.location.origin}/api/rpc`;
  }, []);
  // Wallet Standard auto-detects installed wallets (Phantom, Solflare, Backpack, etc.)
  // No manual adapter imports needed with @solana/wallet-adapter v0.9+
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletEventTracker>{children}</WalletEventTracker>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
