"use client";

import { useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
import type { WalletError } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  useWalletModal,
} from "@solana/wallet-adapter-react-ui";
import { env } from "@/lib/env";
import { publishAmbientWallet } from "@/lib/solana/ambient-wallet-store";
import { WalletAuthHandler } from "@/components/auth/wallet-auth-handler";

import "@solana/wallet-adapter-react-ui/styles.css";

interface SolanaWalletProviderProps {
  children: ReactNode;
}

/**
 * Publishes the live wallet surface into the ambient store (#1097): the
 * provider stack mounts on (platform) routes — or scoped around the sign-in
 * flow — BELOW the global Header, so Header children (UserMenu, AuthModal)
 * can never reach these hooks through context and read the store instead.
 */
function AmbientWalletRegistrar() {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  // Stable owner across re-publishes: same-owner publishes replace the
  // registration IN PLACE, so subscribers never see a transient null while
  // this stack updates its own state (review NEW-3).
  const ownerRef = useRef<object>({});
  const unregisterRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    unregisterRef.current = publishAmbientWallet(
      {
        connected,
        publicKey: publicKey?.toBase58() ?? null,
        disconnect,
        openWalletModal: () => setVisible(true),
      },
      ownerRef.current
    );
  }, [connected, publicKey, disconnect, setVisible]);

  useEffect(() => {
    return () => unregisterRef.current?.();
  }, []);

  return null;
}

export function SolanaWalletProvider({ children }: SolanaWalletProviderProps) {
  const endpoint = useMemo(() => env.NEXT_PUBLIC_SOLANA_RPC_URL, []);

  // Wallet Standard auto-discovers installed wallets (Phantom, Solflare,
  // Backpack, MetaMask Snap, etc.)
  const wallets = useMemo(() => [], []);

  // autoConnect=true lets the adapter reconnect a previously-selected wallet
  // AND — critically — triggers connect() after the WalletModal calls select().
  // With autoConnect=false the modal can select a wallet but never connects it.
  //
  // The old "Nonce already used" race conditions are now mitigated server-side:
  //   • Server-issued nonces (/api/auth/nonce) — no client duplicates
  //   • Split check/consume — failed validations don't burn nonces
  //   • hasTriedAuth ref in WalletAuthHandler — prevents double SIWS per mount
  //   • "if (user) return" guard — skips SIWS when already logged in
  const autoConnect = true;

  const onError = useCallback((error: WalletError) => {
    console.error("[wallet]", error.name, error.message);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider
        wallets={wallets}
        autoConnect={autoConnect}
        onError={onError}
      >
        <WalletModalProvider>
          <AmbientWalletRegistrar />
          <WalletAuthHandler />
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
