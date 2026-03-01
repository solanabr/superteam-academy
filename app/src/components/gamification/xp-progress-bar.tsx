'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { LevelBadge } from '@/components/gamification/level-badge';
import { xpForLevel } from '@/lib/solana/xp';

interface XpProgressBarProps {
  xp: number;
  level: number;
  progress: number;
  toNextLevel: number;
  levelTitle: string;
  className?: string;
}

export function XpProgressBar({
  xp,
  level,
  progress,
  toNextLevel,
  levelTitle,
  className,
}: XpProgressBarProps) {
  const t = useTranslations('gamification');
  const nextLevelXp = xpForLevel(level + 1);

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <LevelBadge level={level} title={levelTitle} size="sm" />

      <div className="flex-1 space-y-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Progress
                value={progress}
                className="h-2.5 cursor-help"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {xp.toLocaleString()} / {nextLevelXp.toLocaleString()} {t('xp')}
            </p>
            <p className="text-xs text-muted-foreground">
              {toNextLevel.toLocaleString()} {t('xp')} to next level
            </p>
          </TooltipContent>
        </Tooltip>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{xp.toLocaleString()} {t('xp')}</span>
          <span>{nextLevelXp.toLocaleString()} {t('xp')}</span>
        </div>
      </div>
    </div>
  );
}
