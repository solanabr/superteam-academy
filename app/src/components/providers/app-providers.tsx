"use client";

import { IntlProvider } from "@/components/providers/intl-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AcademyWalletProvider } from "@/components/providers/wallet-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <IntlProvider>
        <AcademyWalletProvider>{children}</AcademyWalletProvider>
      </IntlProvider>
    </ThemeProvider>
  );
}
