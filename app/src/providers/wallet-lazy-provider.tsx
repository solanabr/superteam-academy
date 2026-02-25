"use client";

import { useState, useEffect, type ReactNode, type ComponentType } from "react";
import {
  WalletBridgeContext,
  ConnectionBridgeContext,
  AnchorWalletBridgeContext,
  type WalletContextState,
} from "@/lib/wallet/context";
import { connection as defaultConnection } from "@/lib/solana/connection";

const WALLET_DEFAULTS: WalletContextState = {
  connected: false,
  connecting: false,
  disconnecting: false,
  publicKey: null,
  wallet: null,
  wallets: [],
  select: () => {},
  connect: async () => {},
  disconnect: async () => {},
  sendTransaction: undefined,
  signTransaction: undefined,
  signAllTransactions: undefined,
  signMessage: undefined,
};

/**
 * Lazy-loads the real WalletProvider (which imports @solana/wallet-adapter-react).
 * Until the heavy bundle arrives, children get safe defaults via our bridge context.
 */
export function LazyWalletProvider({ children }: { children: ReactNode }) {
  const [Provider, setProvider] = useState<ComponentType<{
    children: ReactNode;
  }> | null>(null);

  useEffect(() => {
    import("./wallet-provider").then((mod) => {
      setProvider(() => mod.WalletProvider);
    });
  }, []);

  if (Provider) {
    return <Provider>{children}</Provider>;
  }

  return (
    <ConnectionBridgeContext.Provider value={{ connection: defaultConnection }}>
      <WalletBridgeContext.Provider value={WALLET_DEFAULTS}>
        <AnchorWalletBridgeContext.Provider value={undefined}>
          {children}
        </AnchorWalletBridgeContext.Provider>
      </WalletBridgeContext.Provider>
    </ConnectionBridgeContext.Provider>
  );
}
