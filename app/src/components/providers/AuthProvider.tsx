"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";

import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
// Use test app ID when not set so build/prerender succeeds; replace with your own for production.
const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "clpispdty00ycl80fpueukbhl";

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: false, // avoids extension popup on page load
});

/**
 * Known Privy console warning: "Each child in a list should have a unique 'key' prop."
 * Comes from Privy's internal login modal (options list), not our code. Non-blocking.
 * Upstream: https://github.com/privy-io/examples/issues/135
 */
const privyConfig: any = {
  appearance: {
    theme: "dark",
    walletChainType: "solana-only",
    walletList: [
      "phantom",
      "solflare",
      "backpack",
      "detected_solana_wallets",
      "wallet_connect",
    ],
  },
  externalWallets: {
    solana: {
      connectors: solanaConnectors,
    },
  },
  embeddedWallets: {
    solana: {
      createOnLogin: "users-without-wallets",
    },
  },
  solana: {
    rpcs: {
      "solana:devnet": {
        rpc: createSolanaRpc(process.env.NEXT_PUBLIC_HELIUS_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com"),
        rpcSubscriptions: createSolanaRpcSubscriptions(process.env.NEXT_PUBLIC_RPC_WS_URL || "wss://api.devnet.solana.com"),
      },
    },
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider appId={appId} config={privyConfig}>
      <div key="auth-root" className="contents">
        {children}
      </div>
    </PrivyProvider>
  );
}
