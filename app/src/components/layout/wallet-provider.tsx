"use client";

import { useMemo, type ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { ConnectionProvider } from "@solana/wallet-adapter-react";
import { clusterApiUrl } from "@solana/web3.js";

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: false,
});

const CLUSTER = (process.env.NEXT_PUBLIC_CLUSTER || "devnet") as
  | "devnet"
  | "mainnet-beta";

/** Root-level auth provider — wraps the entire app so Privy is available everywhere (landing + app pages) */
export function PrivyAuthProvider({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {
          walletChainType: "solana-only",
          showWalletLoginFirst: true,
          walletList: ["phantom", "detected_solana_wallets"],
        },
        loginMethods: ["wallet", "google", "github"],
        externalWallets: {
          solana: { connectors: solanaConnectors },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}

/** App-level provider — adds Solana RPC connection for on-chain reads (XP, leaderboard, enrollment) */
export function WalletProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => {
    return process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl(CLUSTER);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>{children}</ConnectionProvider>
  );
}
