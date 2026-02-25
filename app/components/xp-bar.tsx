'use client';

import { useTranslations } from 'next-intl';
import { xpToNextLevel, getLevelTitle, getStreakBonus } from '@/lib/gamification';
import { cn } from '@/lib/utils';
import { Flame, Star, Zap } from 'lucide-react';

interface XPBarProps {
  totalXP: number;
  streakDays?: number;
  className?: string;
  compact?: boolean;
}

export function XPBar({ totalXP, streakDays = 0, className, compact = false }: XPBarProps) {
  const { current, required, level } = xpToNextLevel(totalXP);
  const percent = Math.min(100, Math.round((current / required) * 100));
  const title = getLevelTitle(level);
  const bonus = getStreakBonus(streakDays);
  const hasBonus = streakDays >= 7;
  const t = useTranslations('dashboard');

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {/* Level badge */}
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-purple-600 text-white text-xs font-bold shrink-0">
          {level}
        </div>
        {/* Bar */}
        <div className="flex-1 min-w-0">
          <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        {/* XP count */}
        <span className="text-xs text-gray-400 shrink-0">
          {totalXP.toLocaleString()} XP
        </span>
      </div>
    );
  }

  return (
    <div className={cn('bg-gray-900 rounded-xl p-4 border border-gray-800', className)}>
      {/* Top row: level badge + title + streak bonus */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Level badge */}
          <div className="relative">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white font-bold text-lg shadow-lg">
              {level}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
              <Star className="w-3 h-3 text-white fill-white" />
            </div>
          </div>
          {/* Level info */}
          <div>
            <div className="text-white font-semibold text-sm">{title}</div>
            <div className="text-gray-400 text-xs">
              {t('level')} {level}
            </div>
          </div>
        </div>

        {/* Streak + bonus */}
        <div className="flex items-center gap-3">
          {streakDays > 0 && (
            <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg px-2.5 py-1.5">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-orange-400 text-sm font-semibold">{streakDays}d</span>
            </div>
          )}
          {hasBonus && (
            <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg px-2.5 py-1.5">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-purple-400 text-xs font-medium">{bonus}</span>
            </div>
          )}
        </div>
      </div>

      {/* XP bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">
            {current.toLocaleString()} / {required.toLocaleString()} XP
          </span>
          <span className="text-gray-500">{percent}%</span>
        </div>
        <div className="relative h-3 w-full bg-gray-800 rounded-full overflow-hidden">
          {/* Animated shimmer */}
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-400 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${percent}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse rounded-full" />
          </div>
        </div>
        <div className="text-right text-xs text-gray-500">
          {(required - current).toLocaleString()} XP {t('to_level', { level: level + 1 })}
        </div>
      </div>

      {/* Total XP */}
      <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
        <span className="text-gray-400 text-xs">{t('xp_total')}</span>
        <span className="text-white font-bold text-sm">
          {totalXP.toLocaleString()} XP
        </span>
      </div>
    </div>
  );
}
