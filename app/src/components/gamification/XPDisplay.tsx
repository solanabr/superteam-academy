'use client';

import { FC } from 'react';
import { Badge } from '@/components/ui/badge';
import { Zap, TrendingUp } from 'lucide-react';

interface XPDisplayProps {
  xp: number;
  className?: string;
}

// Level formula from spec: level = floor(sqrt(xp / 100))
export const calculateLevel = (xp: number): number => {
  return Math.floor(Math.sqrt(xp / 100));
};

// XP needed for next level
export const xpForNextLevel = (currentLevel: number): number => {
  return Math.pow(currentLevel + 1, 2) * 100;
};

export const XPDisplay: FC<XPDisplayProps> = ({ xp, className }) => {
  const level = calculateLevel(xp);
  const nextLevelXp = xpForNextLevel(level);
  const currentLevelXp = level > 0 ? Math.pow(level, 2) * 100 : 0;
  const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Level Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-lg font-bold px-3 py-1">
          Lvl {level}
        </Badge>
      </div>

      {/* XP Progress */}
      <div className="flex-1 min-w-[120px]">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Zap className="h-3 w-3" />
            {xp.toLocaleString()} XP
          </span>
          <span className="text-muted-foreground">
            {nextLevelXp.toLocaleString()} XP
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Progress indicator */}
      <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
        <TrendingUp className="h-4 w-4" />
        <span>{Math.round(progress)}%</span>
      </div>
    </div>
  );
};
