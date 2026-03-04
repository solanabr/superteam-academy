"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { AnalyticsProvider } from "./analytics-provider";
import { useWalletStore } from "@/stores/wallet-store";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletStoreBridge } from "./wallet-store-bridge";

import "@solana/wallet-adapter-react-ui/styles.css";

type Props = {
  children: ReactNode;
};

export function AppProviders({ children }: Props) {
  const [queryClient] = useState(() => new QueryClient());
  const initWallet = useWalletStore((state) => state.init);
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

  useEffect(() => {
    initWallet();
  }, [initWallet]);

  const appTree = (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              <WalletStoreBridge />
              <AnalyticsProvider />
              {children}
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );

  return appTree;
}
