"use client";

import { type ReactNode, useMemo, useEffect, useRef } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
  useWallet as useAdapterWallet,
} from "@solana/wallet-adapter-react";
import { WalletBridgeContext } from "@/lib/wallet/context";
import { HELIUS_RPC_URL } from "@/lib/constants";
import { analytics } from "@/providers/analytics-provider";
import { useWalletAuth } from "@/lib/hooks/use-wallet-auth";

/**
 * Bridges adapter state into our lightweight WalletBridgeContext so that
 * all consumers (importing from @/lib/wallet/context) get real values
 * once this provider is loaded.
 */
function WalletBridge({ children }: { children: ReactNode }) {
  const adapterWallet = useAdapterWallet();
  const prevConnected = useRef(false);

  useEffect(() => {
    if (
      adapterWallet.connected &&
      !prevConnected.current &&
      adapterWallet.wallet?.adapter.name
    ) {
      analytics.walletConnected(adapterWallet.wallet.adapter.name);
    }
    if (adapterWallet.connected && !prevConnected.current) {
      window.dispatchEvent(new Event("wallet-connected"));
    } else if (!adapterWallet.connected && prevConnected.current) {
      window.dispatchEvent(new Event("wallet-disconnected"));
    }
    prevConnected.current = adapterWallet.connected;
  }, [adapterWallet.connected, adapterWallet.wallet]);

  // Cast is safe — adapter's WalletContextState is a superset of ours
  return (
    <WalletBridgeContext.Provider value={adapterWallet as any}>
      <WalletAuthRunner />
      {children}
    </WalletBridgeContext.Provider>
  );
}

function WalletAuthRunner() {
  useWalletAuth();
  return null;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => {
    if (typeof window === "undefined") return HELIUS_RPC_URL;
    return `${window.location.origin}/api/rpc`;
  }, []);
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletBridge>{children}</WalletBridge>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
