'use client';

import { Flame, Snowflake } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  freezesAvailable: number;
  isFreezeActiveToday: boolean;
  onUseFreeze?: () => void;
  className?: string;
}

export function StreakCounter({
  currentStreak,
  longestStreak,
  freezesAvailable,
  isFreezeActiveToday,
  onUseFreeze,
  className,
}: StreakCounterProps) {
  const t = useTranslations('gamification');
  const isActive = currentStreak > 0;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-1.5 transition-colors',
              isFreezeActiveToday
                ? 'text-sky-400'
                : isActive
                  ? 'text-orange-500'
                  : 'text-muted-foreground',
            )}
          >
            {isFreezeActiveToday ? (
              <Snowflake
                className={cn(
                  'size-5 shrink-0 transition-all',
                  'animate-pulse drop-shadow-[0_0_6px_rgba(56,189,248,0.5)]',
                )}
                fill="none"
              />
            ) : (
              <Flame
                className={cn(
                  'size-5 shrink-0 transition-all',
                  isActive && 'animate-pulse drop-shadow-[0_0_6px_rgba(249,115,22,0.5)]',
                )}
                fill={isActive ? 'currentColor' : 'none'}
              />
            )}
            <span className="text-lg font-bold tabular-nums leading-none">
              {currentStreak}
            </span>
            <span className="text-xs font-medium leading-none">
              {t('streak')}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-0.5">
            <p>Current: {currentStreak} days</p>
            <p>Best: {longestStreak} days</p>
            {isFreezeActiveToday && (
              <p className="text-sky-400">{t('freeze_active')}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>

      {/* Freeze button — only visible when freezes are available and no freeze active today */}
      {freezesAvailable > 0 && !isFreezeActiveToday && onUseFreeze && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onUseFreeze}
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-0.5',
                'bg-sky-500/10 text-sky-400 transition-colors',
                'hover:bg-sky-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50',
              )}
            >
              <Snowflake className="size-3.5" />
              <span className="text-xs font-semibold tabular-nums">
                {freezesAvailable}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {t('streak_freeze')} &mdash; {t('freeze_available', { count: freezesAvailable })}
            </p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
