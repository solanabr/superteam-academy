"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  useWallet,
  type WalletContextState,
} from "@solana/wallet-adapter-react";

/**
 * "Is there a wallet provider stack above me?" — a question wallet-adapter
 * cannot answer. `useWallet()` outside a `WalletProvider` does not throw or
 * return null; it returns a module-level default context whose property
 * getters `console.error` and hand back empty values. So the providers stamp
 * this boolean context instead, and components that render on BOTH provider
 * and provider-less routes (Header children — the wallet stack mounts only on
 * (platform) routes since #1097) read the stamp before touching the wallet.
 */
const AmbientWalletContext = createContext(false);

/** Stamped by `SolanaWalletProvider` — never render this on its own. */
export function AmbientWalletProvider({ children }: { children: ReactNode }) {
  return (
    <AmbientWalletContext.Provider value={true}>
      {children}
    </AmbientWalletContext.Provider>
  );
}

export function useHasAmbientWallet(): boolean {
  return useContext(AmbientWalletContext);
}

/**
 * `useWallet()` that degrades to `null` instead of to the error-logging
 * default context when no provider is mounted.
 */
export function useOptionalWallet(): WalletContextState | null {
  const hasProvider = useContext(AmbientWalletContext);
  // Unconditional hook call; outside a provider this is the inert default
  // context, which is safe to HOLD as long as no property is read — and when
  // hasProvider is false it is discarded untouched.
  const wallet = useWallet();
  return hasProvider ? wallet : null;
}
