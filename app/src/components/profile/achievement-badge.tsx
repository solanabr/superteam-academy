'use client';

import { Trophy, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  color: string;
}

interface AchievementBadgeProps {
  achievement: AchievementDefinition;
  isEarned: boolean;
  earnedDate?: string;
}

export function AchievementBadge({
  achievement,
  isEarned,
  earnedDate,
}: AchievementBadgeProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group flex flex-col items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg p-2 transition-transform hover:scale-105"
          aria-label={
            isEarned
              ? `${achievement.name} - Earned`
              : `${achievement.name} - Locked`
          }
        >
          <div className="relative">
            <div
              className={cn(
                'flex size-14 items-center justify-center rounded-full transition-all',
                isEarned
                  ? cn(
                    'bg-gradient-to-br shadow-lg',
                    achievement.color,
                    'shadow-current/20',
                  )
                  : 'bg-muted border-2 border-dashed border-muted-foreground/30',
              )}
            >
              {isEarned ? (
                <Trophy className="size-6 text-white drop-shadow-sm" />
              ) : (
                <Lock className="size-5 text-muted-foreground/50" />
              )}
            </div>

            {isEarned && (
              <div className="absolute -right-0.5 -top-0.5 size-4 rounded-full bg-emerald-500 ring-2 ring-background flex items-center justify-center">
                <svg
                  viewBox="0 0 12 12"
                  className="size-2.5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2.5 6L5 8.5L9.5 3.5" />
                </svg>
              </div>
            )}
          </div>

          <span
            className={cn(
              'max-w-[80px] truncate text-center text-[11px] font-medium leading-tight',
              isEarned ? 'text-foreground' : 'text-muted-foreground/60',
            )}
          >
            {achievement.name}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" side="top">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full',
                isEarned
                  ? cn('bg-gradient-to-br', achievement.color)
                  : 'bg-muted',
              )}
            >
              {isEarned ? (
                <Trophy className="size-3.5 text-white" />
              ) : (
                <Lock className="size-3.5 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold">{achievement.name}</p>
              {isEarned && earnedDate && (
                <p className="text-[10px] text-muted-foreground">
                  Earned {new Date(earnedDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {achievement.description}
          </p>
          {!isEarned && (
            <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
              Keep learning to unlock this achievement
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
