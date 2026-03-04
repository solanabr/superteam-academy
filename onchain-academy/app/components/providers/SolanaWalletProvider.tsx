// components/providers/SolanaWalletProvider.tsx

/**
 * FIX: Invalid import — BackpackWalletAdapter
 * ─────────────────────────────────────────────────────────────────────────────
 * FILE:  components/providers/SolanaWalletProvider.tsx
 *
 * ROOT CAUSE:
 *   `BackpackWalletAdapter` was imported from `@solana/wallet-adapter-wallets`,
 *   but it does NOT exist in that package (v0.19.x). Backpack ships its own
 *   adapter in a separate package: `@backpack-foundation/solana-wallet-adapter`.
 *   Since that package is not installed in this project, the import resolves to
 *   `undefined` at runtime and TypeScript emits:
 *     TS2305: Module '@solana/wallet-adapter-wallets' has no exported member
 *     'BackpackWalletAdapter'.
 *
 * FIX (two options — pick one):
 *
 *   Option A (used below — RECOMMENDED): Remove BackpackWalletAdapter entirely.
 *     Modern Backpack, Phantom, and Solflare all implement the Wallet Standard
 *     and are detected automatically by @solana/wallet-adapter-wallets v0.19+
 *     via the StandardWalletAdapter bridge. No explicit adapter needed.
 *
 *   Option B: Install the official package, then import from it:
 *     npm install @backpack-foundation/solana-wallet-adapter
 *     import { BackpackWalletAdapter } from '@backpack-foundation/solana-wallet-adapter';
 *     Then add `new BackpackWalletAdapter()` back to the wallets array.
 *
 * WHAT CHANGED:
 *   Before (broken):
 *     import {
 *       PhantomWalletAdapter,
 *       SolflareWalletAdapter,
 *       BackpackWalletAdapter,            ← TS2305 error
 *     } from '@solana/wallet-adapter-wallets';
 *     const wallets = useMemo(() => [
 *       new PhantomWalletAdapter(),
 *       new SolflareWalletAdapter(),
 *       new BackpackWalletAdapter(),       ← runtime crash
 *     ], []);
 *
 *   After (fixed):
 *     import {
 *       PhantomWalletAdapter,
 *       SolflareWalletAdapter,             ← BackpackWalletAdapter removed
 *     } from '@solana/wallet-adapter-wallets';
 *     const wallets = useMemo(() => [
 *       new PhantomWalletAdapter(),
 *       new SolflareWalletAdapter(),       ← BackpackWalletAdapter removed
 *     ], []);
 */

'use client';

import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  // BackpackWalletAdapter  ← REMOVED: does not exist in @solana/wallet-adapter-wallets.
  //                          Backpack is auto-detected via Wallet Standard in v0.19+.
  //                          To add it explicitly: npm install @backpack-foundation/solana-wallet-adapter
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';

export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  const network =
    (process.env.NEXT_PUBLIC_SOLANA_NETWORK as WalletAdapterNetwork) ||
    WalletAdapterNetwork.Devnet;

  const endpoint = useMemo(() => {
    return process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl(network);
  }, [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      // new BackpackWalletAdapter()  ← add back only after installing the package above
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
