"use client";

/**
 * WalletProvider.tsx
 * ─────────────────────────────────────────────
 * Wraps the app in Solana wallet adapter providers.
 * Supports Phantom and Solflare on Devnet.
 *
 * PLACE THIS FILE AT:
 *   components/providers/WalletProvider.tsx
 *
 * Then import it in app/layout.tsx (see instructions below).
 */

import React, { FC, ReactNode, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

// ─── IMPORTANT: Import the default wallet adapter styles ───────────────────
// Add this line to your app/globals.css (or here if you prefer):
//   @import "@solana/wallet-adapter-react-ui/styles.css";
// ──────────────────────────────────────────────────────────────────────────

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: FC<WalletProviderProps> = ({ children }) => {
  // Use Devnet for development/demo. Change to mainnet-beta for production.
  const network = WalletAdapterNetwork.Devnet;

  // You can swap this for a custom RPC endpoint via env var for better performance.
  const endpoint = useMemo(
    () =>
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl(network),
    [network]
  );

  // Add more wallets here as needed (e.g. BackpackWalletAdapter)
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider
        wallets={wallets}
        // autoConnect reconnects the user's last wallet on page load
        autoConnect
        // Suppress the "wallet not found" error — the modal handles this gracefully
        onError={(error) => {
          console.warn("[WalletProvider] Wallet error:", error.message);
        }}
      >
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};

export default WalletProvider;
