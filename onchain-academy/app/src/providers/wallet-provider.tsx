"use client";

import { type ReactNode, useMemo, useEffect, useRef } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
  useWallet as useAdapterWallet,
  useConnection as useAdapterConnection,
  useAnchorWallet as useAdapterAnchorWallet,
} from "@solana/wallet-adapter-react";
import {
  WalletBridgeContext,
  ConnectionBridgeContext,
  AnchorWalletBridgeContext,
  type WalletContextState,
  type AnchorWallet,
} from "@/lib/wallet/context";
import { HELIUS_RPC_URL, SOLANA_NETWORK } from "@/lib/constants";
import { analytics } from "@/providers/analytics-provider";

/**
 * Bridges adapter state into our lightweight bridge contexts so that
 * all consumers (importing from @/lib/wallet/context) get real values
 * once this provider is loaded.
 */
function WalletBridge({ children }: { children: ReactNode }) {
  const adapterWallet = useAdapterWallet();
  const adapterConnection = useAdapterConnection();
  const adapterAnchorWallet = useAdapterAnchorWallet();
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

  return (
    <ConnectionBridgeContext.Provider value={adapterConnection}>
      <WalletBridgeContext.Provider value={adapterWallet as unknown as WalletContextState}>
        <AnchorWalletBridgeContext.Provider value={adapterAnchorWallet as AnchorWallet | undefined}>
          {children}
        </AnchorWalletBridgeContext.Provider>
      </WalletBridgeContext.Provider>
    </ConnectionBridgeContext.Provider>
  );
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => {
    if (typeof window === "undefined") return HELIUS_RPC_URL;
    return `${window.location.origin}/api/rpc`;
  }, []);
  const wsEndpoint = useMemo(
    () =>
      SOLANA_NETWORK === "devnet"
        ? "wss://api.devnet.solana.com"
        : "wss://api.mainnet-beta.solana.com",
    [],
  );
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint} config={{ wsEndpoint }}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletBridge>{children}</WalletBridge>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
