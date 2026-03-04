'use client';

import { ReactNode, useState, useEffect } from 'react';

export function ClientProviders({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <DynamicProviders>
      {children}
    </DynamicProviders>
  );
}

function DynamicProviders({ children }: { children: ReactNode }) {
  const [PrivyProvider, setPrivyProvider] = useState<any>(null);
  const [SolanaWalletProvider, setSolanaWalletProvider] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      import('@/components/providers/privy-provider'),
      import('@/components/providers/solana-wallet-provider'),
    ]).then(([privy, solana]) => {
      setPrivyProvider(() => privy.PrivyProvider);
      setSolanaWalletProvider(() => solana.SolanaWalletProvider);
    });
  }, []);

  if (!PrivyProvider || !SolanaWalletProvider) {
    return <>{children}</>;
  }

  return (
    <SolanaWalletProvider>
      <PrivyProvider>{children}</PrivyProvider>
    </SolanaWalletProvider>
  );
}
