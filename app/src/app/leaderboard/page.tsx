'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { fetchLeaderboard } from '@/lib/api';
import { calculateLevel, formatXp, shortenAddress } from '@/lib/program';
import type { LeaderboardEntry } from '@/types';

export default function LeaderboardPage() {
  const { t } = useI18n();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard()
      .then((data) => {
        const sorted = data.entries
          .sort((a, b) => b.xpBalance - a.xpBalance)
          .map((e, i) => ({
            ...e,
            level: calculateLevel(e.xpBalance),
            rank: i + 1,
          }));
        setEntries(sorted);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const medalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-16">
      <div className="mb-10">
        <h1 className="text-3xl font-bold sm:text-4xl">{t('leaderboard.title')}</h1>
        <p className="mt-2 text-surface-200">{t('leaderboard.subtitle')}</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="card animate-pulse flex items-center gap-4">
              <div className="h-8 w-8 rounded-lg bg-surface-800" />
              <div className="h-4 flex-1 rounded bg-surface-800" />
              <div className="h-4 w-16 rounded bg-surface-800" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card text-center py-12">
          <p className="text-surface-200 mb-4">{t('common.error')}</p>
          <p className="text-sm text-surface-200/60">{error}</p>
          <p className="text-sm text-surface-200/60 mt-2">
            Leaderboard requires the backend API to be running with Helius DAS integration.
          </p>
        </div>
      ) : entries.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">🏆</div>
          <p className="text-surface-200">No learners yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-center gap-4 px-6 py-3 text-xs font-medium uppercase tracking-wide text-surface-200">
            <div className="w-12">{t('leaderboard.rank')}</div>
            <div className="flex-1">{t('leaderboard.wallet')}</div>
            <div className="w-20 text-right">{t('leaderboard.xp')}</div>
            <div className="w-16 text-right">{t('leaderboard.level')}</div>
          </div>

          {entries.map((entry) => (
            <div
              key={entry.wallet}
              className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                entry.rank <= 3
                  ? 'border-brand-600/30 bg-brand-600/5'
                  : 'border-surface-800 bg-surface-900'
              }`}
            >
              <div className="w-12 text-center text-lg font-bold">
                {medalEmoji(entry.rank)}
              </div>
              <div className="flex-1 font-mono text-sm">
                {shortenAddress(entry.wallet, 6)}
              </div>
              <div className="w-20 text-right font-semibold text-brand-400">
                {formatXp(entry.xpBalance)}
              </div>
              <div className="w-16 text-right">
                <span className="rounded-full bg-accent-600/20 px-2 py-0.5 text-xs font-medium text-accent-400">
                  Lv.{entry.level}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
