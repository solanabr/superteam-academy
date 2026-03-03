"use client";

import { AppProvider, getDefaultConfig } from "@solana/connector/react";
import { ThemeProvider } from "next-themes";
import { env } from "@/lib/env";

type SolanaNetwork = "mainnet" | "mainnet-beta" | "devnet" | "testnet" | "localnet";

function toClusterId(network: SolanaNetwork): `solana:${string}` {
  if (network === "mainnet" || network === "mainnet-beta") {
    return "solana:mainnet";
  }
  return `solana:${network}`;
}

function getDefaultRpcUrl(network: SolanaNetwork): string {
  switch (network) {
    case "mainnet":
    case "mainnet-beta":
      return "https://api.mainnet-beta.solana.com";
    case "testnet":
      return "https://api.testnet.solana.com";
    case "localnet":
      return "http://127.0.0.1:8899";
    case "devnet":
    default:
      return "https://api.devnet.solana.com";
  }
}

const selectedNetwork = env.NEXT_PUBLIC_SOLANA_NETWORK as SolanaNetwork;
const selectedRpcUrl = env.NEXT_PUBLIC_SOLANA_RPC_URL ?? getDefaultRpcUrl(selectedNetwork);
const selectedClusterId = toClusterId(selectedNetwork);

const connectorConfig = getDefaultConfig({
  appName: "Superteam Academy",
  network: selectedNetwork,
  clusters: [
    {
      id: selectedClusterId,
      label: selectedClusterId.replace("solana:", ""),
      url: selectedRpcUrl,
    },
  ],
  autoConnect: false,
  walletConnect: false,
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AppProvider connectorConfig={connectorConfig}>{children}</AppProvider>
    </ThemeProvider>
  );
}
