"use client";

import { ReactNode, useEffect, useMemo } from "react";
import { SessionProvider } from "next-auth/react";
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";

import "@solana/wallet-adapter-react-ui/styles.css";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { track } from "@/lib/analytics";

function WalletEvents() {
  const { connected, publicKey } = useWallet();

  useEffect(() => {
    if (connected && publicKey) {
      track("wallet_connect", { wallet: publicKey.toBase58() });
    }
  }, [connected, publicKey]);

  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter(), new BackpackWalletAdapter()],
    [],
  );

  return (
    <SessionProvider>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <AppErrorBoundary>
              <AnalyticsProvider />
              <WalletEvents />
              {children}
            </AppErrorBoundary>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </SessionProvider>
  );
}
