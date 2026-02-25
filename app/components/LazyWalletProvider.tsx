'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const WalletProviderWrapper = dynamic(
  () => import('./WalletProviderWrapper'),
  { ssr: false }
);

export default function LazyWalletProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return <WalletProviderWrapper>{children}</WalletProviderWrapper>;
}
