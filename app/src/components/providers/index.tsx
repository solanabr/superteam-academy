"use client";

import * as React from "react";
import { ThemeProvider } from "./theme-provider";
import { QueryProvider } from "./query-provider";
import { SolanaWalletProvider } from "./wallet-provider";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <SolanaWalletProvider>{children}</SolanaWalletProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
