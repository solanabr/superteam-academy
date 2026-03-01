'use client';

import { useTranslations } from 'next-intl';
import { SearchX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ChallengeBrowserCard } from '@/components/challenges/challenge-browser-card';
import { cn } from '@/lib/utils';
import type { CodingChallenge } from '@/lib/challenges';

interface ChallengeGridProps {
  challenges: CodingChallenge[];
  total: number;
  className?: string;
}

export function ChallengeGrid({ challenges, total, className }: ChallengeGridProps) {
  const t = useTranslations('challenges_page');

  if (challenges.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="bg-muted flex size-16 items-center justify-center rounded-full">
          <SearchX className="text-muted-foreground size-7" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h3 className="text-lg font-semibold">{t('no_challenges')}</h3>
          <p className="text-muted-foreground max-w-sm text-sm">
            {t('try_different_filters')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Count */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {challenges.length === total
            ? t('total_challenges', { count: total })
            : `${challenges.length} / ${total}`}
        </Badge>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {challenges.map((challenge) => (
          <ChallengeBrowserCard key={challenge.id} challenge={challenge} />
        ))}
      </div>
    </div>
  );
}
