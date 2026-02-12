'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { LeaderboardEntry } from '@/lib/mock-data';
import { calculateLevel } from '@/lib/mock-data';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  timeFilter: 'weekly' | 'monthly' | 'allTime';
}

function getMedalStyle(rank: number): string {
  if (rank === 1) return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
  if (rank === 2) return 'bg-zinc-400/20 text-zinc-300 border-zinc-400/50';
  if (rank === 3) return 'bg-orange-600/20 text-orange-400 border-orange-600/50';
  return '';
}

function getMedalIcon(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return '';
}

export function LeaderboardTable({ entries, currentUserId, timeFilter }: LeaderboardTableProps) {
  const t = useTranslations('leaderboard');
  const [page, setPage] = useState(0);
  const perPage = 10;

  const sorted = [...entries].sort((a, b) => {
    if (timeFilter === 'weekly') return b.weeklyXP - a.weeklyXP;
    if (timeFilter === 'monthly') return b.monthlyXP - a.monthlyXP;
    return b.totalXP - a.totalXP;
  });

  const totalPages = Math.ceil(sorted.length / perPage);
  const pageEntries = sorted.slice(page * perPage, (page + 1) * perPage);

  function getXP(entry: LeaderboardEntry): number {
    if (timeFilter === 'weekly') return entry.weeklyXP;
    if (timeFilter === 'monthly') return entry.monthlyXP;
    return entry.totalXP;
  }

  return (
    <div>
      <div className="rounded-xl border">
        <div className="grid grid-cols-[60px_1fr_80px_80px_60px_80px] gap-2 border-b px-4 py-3 text-xs font-medium text-muted-foreground sm:grid-cols-[60px_1fr_100px_80px_80px_100px]">
          <span>{t('rank')}</span>
          <span>{t('player')}</span>
          <span className="text-right">{t('xp')}</span>
          <span className="text-right">{t('level')}</span>
          <span className="text-right">{t('streakLabel')}</span>
          <span className="text-right">{t('badgesCount')}</span>
        </div>
        {pageEntries.map((entry, i) => {
          const rank = page * perPage + i + 1;
          const isCurrentUser = entry.userId === currentUserId;
          const medalStyle = getMedalStyle(rank);

          return (
            <div
              key={entry.userId}
              className={`grid grid-cols-[60px_1fr_80px_80px_60px_80px] gap-2 border-b px-4 py-3 text-sm last:border-b-0 sm:grid-cols-[60px_1fr_100px_80px_80px_100px] ${isCurrentUser ? 'bg-primary/10' : ''} ${medalStyle ? `${medalStyle} border-l-2` : ''}`}
            >
              <span className="font-bold">
                {getMedalIcon(rank)} #{rank}
              </span>
              <span className="truncate font-medium">{entry.displayName}</span>
              <span className="text-right font-semibold text-emerald-500">
                {getXP(entry).toLocaleString()}
              </span>
              <span className="text-right">{calculateLevel(entry.totalXP)}</span>
              <span className="text-right">{entry.currentStreak > 0 ? `🔥${entry.currentStreak}` : '-'}</span>
              <span className="text-right">{entry.badgeCount}</span>
            </div>
          );
        })}
      </div>
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {t('prev')}
          </button>
          <span className="text-sm text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {t('nextPage')}
          </button>
        </div>
      )}
    </div>
  );
}
