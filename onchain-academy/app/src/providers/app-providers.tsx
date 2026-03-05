"use client";

import type { PropsWithChildren } from "react";
import { AnalyticsProvider } from "@/providers/analytics-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { LocaleProvider } from "@/providers/locale-provider";
import { SolanaProvider } from "@/providers/solana-provider";
import { ThemeProvider } from "@/providers/theme-provider";

export function AppProviders({
  children,
}: PropsWithChildren): React.JSX.Element {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <LocaleProvider>
          <SolanaProvider>
            <AnalyticsProvider>{children}</AnalyticsProvider>
          </SolanaProvider>
        </LocaleProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
