"use client";

import { useMemo, useEffect, useCallback, type ReactNode } from "react";
import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { ConnectionProvider } from "@solana/wallet-adapter-react";
import { clusterApiUrl } from "@solana/web3.js";

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: false,
});

const CLUSTER = (process.env.NEXT_PUBLIC_CLUSTER || "devnet") as
  | "devnet"
  | "mainnet-beta";

/**
 * Syncs the Privy access token to a cookie so server-side API routes can read it.
 * Privy stores tokens in localStorage by default; cookies require dashboard config.
 * This bridge ensures server auth works without that setup.
 */
function PrivyTokenSync() {
  const { authenticated, getAccessToken } = usePrivy();

  const syncToken = useCallback(async () => {
    if (!authenticated) {
      document.cookie = "privy-access-token=; path=/; max-age=0; samesite=lax";
      return;
    }
    const token = await getAccessToken();
    if (token) {
      document.cookie = `privy-access-token=${token}; path=/; max-age=3600; samesite=lax`;
    }
  }, [authenticated, getAccessToken]);

  useEffect(() => {
    syncToken();
    // Refresh token cookie every 5 minutes (access tokens expire)
    const id = setInterval(syncToken, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [syncToken]);

  return null;
}

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
      <PrivyTokenSync />
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
