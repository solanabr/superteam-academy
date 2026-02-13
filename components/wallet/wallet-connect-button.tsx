'use client';

import { useEffect, useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function WalletConnectButton({ className }: { className?: string }): JSX.Element {
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        className={
          className ??
          'inline-flex h-10 min-w-[128px] items-center justify-center rounded-2xl border border-border/70 bg-card/75 px-3 text-sm font-semibold text-foreground/85 shadow-sm'
        }
      >
        Connect
      </button>
    );
  }

  return <WalletMultiButton className={className} />;
}
