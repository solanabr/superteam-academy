'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';
import { WalletMultiButton } from './WalletProvider';

export function ProfileConnectCTA() {
  const { publicKey } = useWallet();
  if (publicKey) {
    return (
      <p className="text-body mt-4 text-[rgb(var(--text-muted))]">
        <Link
          href="/dashboard"
          className="font-medium text-accent hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg-page))] focus-visible:outline-none rounded"
        >
          View your progress in Dashboard →
        </Link>
      </p>
    );
  }
  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      <p className="text-body text-[rgb(var(--text-muted))]">
        Connect your wallet to see your profile, achievements, and credentials.
      </p>
      <WalletMultiButton className="!h-10 !rounded-lg !px-5 !text-body" />
    </div>
  );
}
