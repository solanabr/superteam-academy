'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { ProfileContent } from './ProfileContent';
import { ProfileConnectCTA } from './ProfileConnectCTA';
import Link from 'next/link';

export function ProfileShell({ children }: { children?: React.ReactNode }) {
  const { publicKey } = useWallet();

  if (publicKey) {
    return <ProfileContent />;
  }

  return (
    <section
      className="mt-8 rounded-xl border border-border/50 bg-surface p-8 text-center"
      aria-labelledby="profile-heading"
      aria-describedby="profile-desc"
    >
      <p className="text-body text-[rgb(var(--text-muted))]">
        Profile header (avatar, name, bio, social), skill radar, achievements, and on-chain credentials will appear here when you connect your wallet.
      </p>
      <ProfileConnectCTA />
      <p className="text-caption mt-6 text-[rgb(var(--text-subtle))]">
        <Link href="/settings" className="text-accent hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded focus-visible:outline-none">
          Edit profile in Settings →
        </Link>
      </p>
    </section>
  );
}
