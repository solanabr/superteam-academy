'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Trophy, Flame, Zap, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

const LEADERBOARD = [
  { rank: 1, address: '7xKX...9mNp', xp: 45000, level: 21, streak: 45, badge: '🏆', color: 'from-yellow-500 to-orange-500' },
  { rank: 2, address: '3fBZ...2qRt', xp: 38500, level: 19, streak: 32, badge: '🥈', color: 'from-gray-400 to-gray-500' },
  { rank: 3, address: 'Ap9S...7kLm', xp: 32100, level: 17, streak: 28, badge: '🥉', color: 'from-orange-700 to-yellow-700' },
  { rank: 4, address: '9mQR...4nVz', xp: 28400, level: 16, streak: 21, badge: '', color: '' },
  { rank: 5, address: '2kTp...8jWx', xp: 24700, level: 15, streak: 14, badge: '', color: '' },
  { rank: 6, address: 'HnRs...1cBq', xp: 19300, level: 13, streak: 8,  badge: '', color: '' },
  { rank: 7, address: 'QmKv...5pLz', xp: 15800, level: 12, streak: 5,  badge: '', color: '' },
  { rank: 8, address: 'WrXd...0tGy', xp: 12400, level: 11, streak: 3,  badge: '', color: '' },
  { rank: 9, address: 'TbFq...6hJn', xp: 9800,  level: 9,  streak: 1,  badge: '', color: '' },
  { rank: 10, address: 'VpYc...3mDk', xp: 8100,  level: 8,  streak: 0,  badge: '', color: '' },
];

type Period = 'semana' | 'mes' | 'todo';

export default function LeaderboardPage() {
  const t = useTranslations('leaderboard');
  const [period, setPeriod] = useState<Period>('todo');

  const PERIOD_LABELS: Record<Period, string> = {
    semana: t('this_week'),
    mes: t('this_month'),
    todo: t('all_time'),
  };

  // Row index 4 = rank 5 = "você"
  const YOU_INDEX = 4;

  const top3 = LEADERBOARD.slice(0, 3);
  const rest = LEADERBOARD.slice(3);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Page header */}
      <div className="border-b border-gray-800 bg-gray-900/60 py-12 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-8 w-8 text-yellow-400" />
            <h1 className="text-4xl font-extrabold text-white">{t('title')}</h1>
          </div>
          <p className="text-gray-400">{t('subtitle')}</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Period toggle */}
        <div className="flex gap-2 mb-8 bg-gray-900 rounded-xl p-1 w-fit">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-5 py-2 rounded-lg text-sm font-medium transition-all',
                period === p
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Top 3 podium cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {top3.map((entry) => (
            <div
              key={entry.rank}
              className={cn(
                'relative rounded-2xl border p-5 text-center transition-all hover:scale-[1.02]',
                entry.rank === 1
                  ? 'border-yellow-600/50 bg-yellow-900/20 ring-1 ring-yellow-600/30 shadow-lg shadow-yellow-900/20'
                  : entry.rank === 2
                  ? 'border-gray-600/50 bg-gray-800/40'
                  : 'border-orange-700/50 bg-orange-900/20'
              )}
            >
              {entry.rank === 1 && (
                <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-6 text-yellow-400 drop-shadow-lg" />
              )}

              <div className="text-3xl mb-2 mt-1">{entry.badge}</div>

              <div
                className={cn(
                  'mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br text-white font-bold text-lg',
                  entry.color || 'from-gray-700 to-gray-600'
                )}
              >
                {entry.address.slice(0, 2).toUpperCase()}
              </div>

              <div className="text-sm font-medium text-white mb-1 font-mono truncate">
                {entry.address}
              </div>

              <div className="flex items-center justify-center gap-1 text-yellow-400 font-bold text-sm">
                <Zap className="h-4 w-4" />
                {entry.xp.toLocaleString()} XP
              </div>

              <div className="text-xs text-gray-500 mt-1">{t('level')} {entry.level}</div>

              {entry.streak > 0 && (
                <div className="flex items-center justify-center gap-1 mt-2 text-xs text-orange-400">
                  <Flame className="h-3 w-3" />
                  {entry.streak} {t('days')}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Rankings table */}
        <div className="rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/60">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('rank')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('learner')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('xp')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  {t('level')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  {t('streak')}
                </th>
              </tr>
            </thead>
            <tbody>
              {rest.map((entry, i) => {
                const absoluteIndex = i + 3; // offset by top 3
                const isYou = absoluteIndex === YOU_INDEX;

                return (
                  <tr
                    key={entry.rank}
                    className={cn(
                      'border-b border-gray-800/50 transition-colors',
                      isYou
                        ? 'bg-purple-900/20 border-l-2 border-l-purple-500'
                        : 'hover:bg-gray-900/40'
                    )}
                  >
                    {/* Rank */}
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold',
                          entry.rank <= 3
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'text-gray-500'
                        )}
                      >
                        {entry.rank}
                      </span>
                    </td>

                    {/* Learner */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-800 text-sm font-medium text-gray-300">
                          {entry.address.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-200 font-mono">
                            {entry.address}
                          </div>
                          {isYou && (
                            <div className="text-xs text-purple-400 font-medium">{t('you_marker')}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* XP */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 text-sm font-bold text-yellow-400">
                        <Zap className="h-3.5 w-3.5" />
                        {entry.xp.toLocaleString()}
                      </div>
                    </td>

                    {/* Level */}
                    <td className="px-4 py-3.5 text-right hidden sm:table-cell">
                      <span className="inline-flex items-center rounded-full bg-purple-900/40 px-2 py-0.5 text-xs font-medium text-purple-300 border border-purple-700/30">
                        {t('level')} {entry.level}
                      </span>
                    </td>

                    {/* Streak */}
                    <td className="px-4 py-3.5 text-right hidden md:table-cell">
                      {entry.streak > 0 ? (
                        <div className="flex items-center justify-end gap-1 text-sm text-orange-400">
                          <Flame className="h-3.5 w-3.5" />
                          <span>{entry.streak} {t('days')}</span>
                        </div>
                      ) : (
                        <span className="text-gray-700 text-sm">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-center text-sm text-gray-600">
          {t('learners_in_ranking', { count: LEADERBOARD.length })}
        </p>
      </div>
    </div>
  );
}
