'use client';

import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LevelBadgeProps {
  level: number;
  title: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TIER_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  newcomer: {
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    border: 'border-zinc-300 dark:border-zinc-600',
    text: 'text-zinc-700 dark:text-zinc-300',
  },
  explorer: {
    bg: 'bg-emerald-50 dark:bg-emerald-950',
    border: 'border-emerald-300 dark:border-emerald-700',
    text: 'text-emerald-700 dark:text-emerald-400',
  },
  builder: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-300 dark:border-blue-700',
    text: 'text-blue-700 dark:text-blue-400',
  },
  developer: {
    bg: 'bg-violet-50 dark:bg-violet-950',
    border: 'border-violet-300 dark:border-violet-700',
    text: 'text-violet-700 dark:text-violet-400',
  },
  engineer: {
    bg: 'bg-purple-50 dark:bg-purple-950',
    border: 'border-purple-300 dark:border-purple-700',
    text: 'text-purple-700 dark:text-purple-400',
  },
  architect: {
    bg: 'bg-amber-50 dark:bg-amber-950',
    border: 'border-amber-300 dark:border-amber-700',
    text: 'text-amber-700 dark:text-amber-400',
  },
  specialist: {
    bg: 'bg-orange-50 dark:bg-orange-950',
    border: 'border-orange-300 dark:border-orange-700',
    text: 'text-orange-700 dark:text-orange-400',
  },
  expert: {
    bg: 'bg-rose-50 dark:bg-rose-950',
    border: 'border-rose-300 dark:border-rose-700',
    text: 'text-rose-700 dark:text-rose-400',
  },
  master: {
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-300 dark:border-red-700',
    text: 'text-red-700 dark:text-red-400',
  },
  grandmaster: {
    bg: 'bg-fuchsia-50 dark:bg-fuchsia-950',
    border: 'border-fuchsia-300 dark:border-fuchsia-700',
    text: 'text-fuchsia-700 dark:text-fuchsia-400',
  },
  legend: {
    bg: 'bg-yellow-50 dark:bg-yellow-950',
    border: 'border-yellow-400 dark:border-yellow-600',
    text: 'text-yellow-700 dark:text-yellow-400',
  },
};

const SIZE_MAP = {
  sm: { container: 'size-8', text: 'text-xs', title: 'text-[10px]' },
  md: { container: 'size-11', text: 'text-sm', title: 'text-xs' },
  lg: { container: 'size-14', text: 'text-lg', title: 'text-sm' },
} as const;

function getTierColors(title: string) {
  const key = title.toLowerCase();
  return TIER_COLORS[key] ?? TIER_COLORS.newcomer!;
}

export function LevelBadge({ level, title, size = 'md', className }: LevelBadgeProps) {
  const tier = getTierColors(title);
  const dimensions = SIZE_MAP[size];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('flex flex-col items-center gap-1', className)}>
          <div
            className={cn(
              'flex items-center justify-center rounded-full border-2 font-bold transition-transform hover:scale-105',
              tier.bg,
              tier.border,
              tier.text,
              dimensions.container,
              dimensions.text,
            )}
            role="img"
            aria-label={`Level ${level} - ${title}`}
          >
            {level}
          </div>
          <span
            className={cn(
              'font-medium leading-none',
              tier.text,
              dimensions.title,
            )}
          >
            {title}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        Level {level} &middot; {title}
      </TooltipContent>
    </Tooltip>
  );
}
