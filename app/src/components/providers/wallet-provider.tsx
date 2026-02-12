'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import type { ReactNode } from 'react';

const WalletModalProvider = dynamic(
  () =>
    import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletModalProvider),
  { ssr: false }
);

const WalletMultiButton = dynamic(
  () =>
    import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

const rpc =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SOLANA_RPC_URL
    ? process.env.NEXT_PUBLIC_SOLANA_RPC_URL
    : 'https://api.devnet.solana.com';

export function WalletProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => rpc, []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}

export { WalletMultiButton };
