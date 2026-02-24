'use client';

import { useMemo } from 'react';
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from '@solana/wallet-adapter-react';
import { HELIUS_RPC } from '@/lib/solana/constants';

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => HELIUS_RPC, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={[]} autoConnect>
        {children}
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
