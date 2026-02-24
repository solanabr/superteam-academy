'use client';

import { Flame } from 'lucide-react';
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
  className?: string;
}

export function StreakCounter({
  currentStreak,
  longestStreak,
  className,
}: StreakCounterProps) {
  const t = useTranslations('gamification');
  const isActive = currentStreak > 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'flex items-center gap-1.5 transition-colors',
            isActive ? 'text-orange-500' : 'text-muted-foreground',
            className,
          )}
        >
          <Flame
            className={cn(
              'size-5 shrink-0 transition-all',
              isActive && 'animate-pulse drop-shadow-[0_0_6px_rgba(249,115,22,0.5)]',
            )}
            fill={isActive ? 'currentColor' : 'none'}
          />
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
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
