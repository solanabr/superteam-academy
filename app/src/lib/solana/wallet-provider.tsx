"use client";

import { ReactNode, useCallback, useMemo, useState, useEffect } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { WalletError } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

import "@solana/wallet-adapter-react-ui/styles.css";

/**
 * Defers WalletModalProvider until after hydration to prevent Radix ID
 * mismatches. The modal provider renders DOM elements that differ between
 * server and client, which shifts React's useId() counter for all
 * downstream Radix components (DropdownMenu, Sheet, etc.).
 *
 * ConnectionProvider and WalletProvider are pure context — safe during SSR.
 * autoConnect is also deferred to avoid wallet state changes mid-hydration.
 */
export function SolanaWalletProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl("devnet"),
    [],
  );

  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  const onWalletError = useCallback((error: WalletError) => {
    console.warn("[Wallet]", error.message);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={mounted} onError={onWalletError}>
        {mounted ? (
          <WalletModalProvider>{children}</WalletModalProvider>
        ) : (
          children
        )}
      </WalletProvider>
    </ConnectionProvider>
  );
}
