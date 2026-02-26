'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const WalletProviderWrapper = dynamic(
  () => import('./WalletProviderWrapper'),
  { ssr: false }
);

/**
 * Defers loading the Solana wallet adapter until the browser is idle.
 * This keeps the wallet provider out of the critical render path, reducing
 * Total Blocking Time on initial load while still being available for user interaction.
 */
export default function LazyWalletProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Load wallet provider in idle time to reduce TBT
    const load = () => setReady(true);
    if ('requestIdleCallback' in window) {
      const id = (window as Window & { requestIdleCallback: (cb: () => void, opts?: object) => number })
        .requestIdleCallback(load, { timeout: 2000 });
      return () => (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(id);
    } else {
      // Fallback: small delay so LCP/FCP aren't blocked
      const t = setTimeout(load, 100);
      return () => clearTimeout(t);
    }
  }, []);

  if (!ready) {
    return <>{children}</>;
  }

  return <WalletProviderWrapper>{children}</WalletProviderWrapper>;
}
