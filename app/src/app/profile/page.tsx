'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useI18n } from '@/i18n';
import { useXpBalance } from '@/hooks/useProgram';
import { fetchCredentials } from '@/lib/api';
import { shortenAddress } from '@/lib/program';
import XpDisplay from '@/components/ui/XpDisplay';
import StreakDisplay from '@/components/ui/StreakDisplay';
import CredentialGrid from '@/components/achievements/CredentialGrid';
import ConnectButton from '@/components/wallet/ConnectButton';
import { useEffect, useState } from 'react';
import type { CredentialNFT } from '@/types';

export default function ProfilePage() {
  const { t } = useI18n();
  const { publicKey, connected } = useWallet();
  const { balance, level } = useXpBalance();
  const [credentials, setCredentials] = useState<CredentialNFT[]>([]);
  const [credLoading, setCredLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) return;
    setCredLoading(true);
    fetchCredentials(publicKey.toBase58())
      .then((data) => setCredentials(data.credentials || []))
      .catch(() => setCredentials([]))
      .finally(() => setCredLoading(false));
  }, [publicKey]);

  if (!connected) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="text-5xl mb-6">👤</div>
        <h1 className="text-3xl font-bold mb-4">{t('profile.title')}</h1>
        <p className="text-surface-200 mb-8">{t('course.notEnrolled')}</p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-16">
      <div className="mb-10">
        <h1 className="text-3xl font-bold sm:text-4xl">{t('profile.title')}</h1>
        <p className="mt-2 font-mono text-sm text-surface-200">
          {publicKey ? shortenAddress(publicKey.toBase58(), 8) : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* XP Card */}
        <div className="card">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-surface-200">
            {t('profile.xpBalance')}
          </h3>
          <XpDisplay xp={balance} size="lg" />
        </div>

        {/* Streak Card */}
        <StreakDisplay />
      </div>

      {/* Credentials */}
      <div className="mt-12">
        <h2 className="mb-6 text-2xl font-bold">{t('profile.credentials')}</h2>
        {credLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-square rounded-xl bg-surface-800 mb-4" />
                <div className="h-4 w-3/4 rounded bg-surface-800" />
              </div>
            ))}
          </div>
        ) : (
          <CredentialGrid credentials={credentials} />
        )}
      </div>
    </div>
  );
}
