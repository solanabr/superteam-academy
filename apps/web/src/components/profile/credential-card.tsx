'use client';

import { useTranslations } from 'next-intl';
import type { OnChainCredential } from '@/lib/mock-data';

interface CredentialCardProps {
  credential: OnChainCredential;
}

export function CredentialCard({ credential }: CredentialCardProps) {
  const t = useTranslations('profile');

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 text-xl">
          🏆
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{credential.track}</p>
          <p className="text-sm text-muted-foreground">{credential.level}</p>
        </div>
        {credential.verified && (
          <span className="text-emerald-500" title={t('verified')}>✓</span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{t('mint')}: {credential.mintAddress}</span>
        <span>{new Date(credential.issuedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
