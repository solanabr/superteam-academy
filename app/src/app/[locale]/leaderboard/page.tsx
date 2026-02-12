'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { createStubLearningProgressService } from '@/lib/stub-learning-progress';
import type { LeaderboardEntry } from '@/lib/types';

export default function LeaderboardPage() {
  const t = useTranslations('leaderboard');
  const { publicKey } = useWallet();
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'alltime'>('alltime');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const svc = createStubLearningProgressService();
    svc.getLeaderboard(timeframe).then(setEntries);
  }, [timeframe]);

  const currentWallet = publicKey?.toBase58();

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
      <div className="mt-6 flex flex-wrap gap-2">
        {(['weekly', 'monthly', 'allTime'] as const).map((key) => (
          <button
            key={key}
            onClick={() => setTimeframe(key === 'allTime' ? 'alltime' : key)}
            className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
              timeframe === (key === 'allTime' ? 'alltime' : key)
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card hover:bg-muted/50'
            }`}
          >
            {t(key)}
          </button>
        ))}
      </div>
      <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-sm font-medium text-muted-foreground">
                <th className="px-6 py-4">{t('rank')}</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">{t('xp')}</th>
                <th className="px-6 py-4">Level</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr
                  key={e.userId}
                  className={`border-b border-border last:border-0 ${e.wallet === currentWallet ? 'bg-primary/10' : 'hover:bg-muted/30'}`}
                >
                  <td className="px-6 py-4 font-medium">{e.rank}</td>
                  <td className="px-6 py-4 font-mono text-sm">{e.displayName}</td>
                  <td className="px-6 py-4">{e.xp}</td>
                  <td className="px-6 py-4">{e.level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {entries.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No rankings yet. Complete lessons (and connect your wallet) to earn XP and appear here.</p>
            <p className="mt-1 text-xs text-muted-foreground">Leaderboard is derived from XP; data is stored locally in this demo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
