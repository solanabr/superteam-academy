"use client";

import { AppProvider, getDefaultConfig } from "@solana/connector/react";
import { env } from "@/lib/env";

const connectorConfig = getDefaultConfig({
  appName: "Superteam Academy",
  network: env.NEXT_PUBLIC_SOLANA_NETWORK,
  autoConnect: false,
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider connectorConfig={connectorConfig}>{children}</AppProvider>
  );
}
