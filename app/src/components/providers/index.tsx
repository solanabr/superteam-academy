"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import { WalletProvider } from "./WalletProvider";
import { ThemeProvider } from "./ThemeProvider";
import { I18nProvider } from "./I18nProvider";
import { AnalyticsProvider } from "./AnalyticsProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <AnalyticsProvider>
            <WalletProvider>{children}</WalletProvider>
          </AnalyticsProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
