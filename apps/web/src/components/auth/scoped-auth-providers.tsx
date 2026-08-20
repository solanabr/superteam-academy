"use client";

import type { ReactNode } from "react";
import { SolanaWalletProvider } from "@/lib/solana/wallet-provider";
import { DynamicWalletProvider } from "@/components/auth/dynamic-wallet-provider";

/**
 * The full wallet/Dynamic provider stack, for the places OUTSIDE (platform)
 * routes that still need it on demand (#1097): around the AuthModal body when
 * it opens on a marketing/admin page, and under `DynamicReturnCatcher` when a
 * social-redirect return lands on one.
 *
 * Loaded exclusively through `React.lazy` — this module is the chunk boundary
 * that keeps wallet-adapter, Dynamic, and TanStack Query out of marketing
 * first loads. Never import it statically from anything marketing-reachable.
 *
 * `lib/dynamic/client.ts`'s SSR tree-shape constraint (never mount the
 * providers browser-only at layout level) does not apply here: everything
 * under this component mounts post-hydration on user action or URL detection,
 * so there is no server tree to mismatch. The Dynamic client itself is a
 * module singleton with an `initialised` flag, so a second stack in the same
 * page never re-initialises it.
 *
 * Mounting this beside a live (platform) stack would duplicate autoConnect
 * and wallet listeners — callers must gate on the ambient store
 * (`useAmbientWalletLive` / the capture flag) first.
 */
export default function ScopedAuthProviders({
  children,
}: {
  children?: ReactNode;
}) {
  return (
    <SolanaWalletProvider>
      <DynamicWalletProvider>{children}</DynamicWalletProvider>
    </SolanaWalletProvider>
  );
}
