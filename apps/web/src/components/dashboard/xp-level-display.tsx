'use client';

import { useTranslations } from 'next-intl';
import { Progress } from '@/components/ui/progress';
import { xpProgressInLevel, getRankTitle } from '@/lib/mock-data';

interface XPLevelDisplayProps {
  totalXP: number;
  level: number;
}

export function XPLevelDisplay({ totalXP, level }: XPLevelDisplayProps) {
  const t = useTranslations('dashboard');
  const progress = xpProgressInLevel(totalXP);
  const rank = getRankTitle(level);

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{t('xp')}</p>
          <p className="text-3xl font-bold">{totalXP.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">{t('level')}</p>
          <p className="text-3xl font-bold">{level}</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>{t('rank')}: {rank}</span>
          <span>{progress.current} / {progress.required} XP</span>
        </div>
        <Progress value={progress.percent} className="h-2" />
      </div>
    </div>
  );
}
