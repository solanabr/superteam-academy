'use client';

import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Wallet } from 'lucide-react';

/**
 * Profile index route.
 *
 * When a wallet is connected the user is redirected to their
 * public profile at `/profile/<walletAddress>`.
 * Otherwise a prompt to connect a wallet is displayed.
 */
export default function ProfileIndexPage() {
  const { publicKey, connected } = useWallet();
  const router = useRouter();
  const tProfile = useTranslations('profile');

  useEffect(() => {
    if (connected && publicKey) {
      router.replace(`/profile/${publicKey.toBase58()}`);
    }
  }, [connected, publicKey, router]);

  // While redirecting, avoid a flash of the fallback UI
  if (connected && publicKey) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
        <Wallet className="size-7 text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">
          {tProfile('connect_to_view')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {tProfile('connect_to_view_desc')}
        </p>
      </div>
    </div>
  );
}
