"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";
import { Web3Provider } from "@/components/providers/web3-provider";
import { WalletAuthProvider } from "@/components/providers/wallet-auth-provider";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <Web3Provider>
          <WalletAuthProvider>
            <AnalyticsProvider>{children}</AnalyticsProvider>
          </WalletAuthProvider>
        </Web3Provider>
      </ThemeProvider>
    </SessionProvider>
  );
}
