'use client';

import { calculateLevel, levelProgress, xpForLevel } from '@/lib/solana';
import { formatXp } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface Props {
  xp: number;
  showDetails?: boolean;
}

export function LevelProgress({ xp, showDetails = true }: Props) {
  const level = calculateLevel(xp);
  const progress = levelProgress(xp);
  const nextLevelXp = xpForLevel(level + 1);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Level {level}</span>
        {showDetails && (
          <span className="text-muted-foreground">
            {formatXp(xp)} / {formatXp(nextLevelXp)} XP
          </span>
        )}
      </div>
      <Progress value={progress * 100} className="h-2" />
      {showDetails && (
        <p className="text-xs text-muted-foreground">
          {formatXp(nextLevelXp - xp)} XP to Level {level + 1}
        </p>
      )}
    </div>
  );
}
