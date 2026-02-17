"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Web3Provider } from "@/components/providers/web3-provider";
import { WalletAuthProvider } from "@/components/providers/wallet-auth-provider";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <Web3Provider>
        <WalletAuthProvider>{children}</WalletAuthProvider>
      </Web3Provider>
    </ThemeProvider>
  );
}
