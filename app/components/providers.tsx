"use client";

import { AppProvider, getDefaultConfig } from "@solana/connector/react";
import { ThemeProvider } from "next-themes";
import { env } from "@/lib/env";

const connectorConfig = getDefaultConfig({
  appName: "Superteam Academy",
  network: env.NEXT_PUBLIC_SOLANA_NETWORK,
  autoConnect: false,
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AppProvider connectorConfig={connectorConfig}>{children}</AppProvider>
    </ThemeProvider>
  );
}
