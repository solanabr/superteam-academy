'use client';

import { FC } from 'react';
import { Flame, Snowflake } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StreakCounterProps {
  days: number;
  hasFreeze?: boolean;
  className?: string;
}

const getStreakColor = (days: number): string => {
  if (days >= 365) return 'bg-gradient-to-r from-purple-500 to-pink-500';
  if (days >= 100) return 'bg-gradient-to-r from-orange-500 to-red-500';
  if (days >= 30) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
  if (days >= 7) return 'bg-gradient-to-r from-green-500 to-yellow-500';
  return 'bg-gradient-to-r from-blue-500 to-green-500';
};

const getStreakTitle = (days: number): string => {
  if (days >= 365) return 'Legendary';
  if (days >= 100) return 'On Fire';
  if (days >= 30) return 'Committed';
  if (days >= 7) return 'Consistent';
  if (days >= 1) return 'Active';
  return 'Start Learning';
};

export const StreakCounter: FC<StreakCounterProps> = ({
  days,
  hasFreeze = false,
  className,
}) => {
  const colorClass = getStreakColor(days);
  const title = getStreakTitle(days);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-white ${colorClass}`}
      >
        <Flame className="h-4 w-4" />
        <span className="font-bold">{days}</span>
        <span className="text-sm opacity-90">day{days !== 1 ? 's' : ''}</span>
      </div>
      {hasFreeze && (
        <Badge variant="outline" className="gap-1">
          <Snowflake className="h-3 w-3" />
          Freeze
        </Badge>
      )}
      <span className="text-sm text-muted-foreground hidden sm:inline">
        {title}
      </span>
    </div>
  );
};
