'use client';

import { useTranslations } from 'next-intl';
import { badges as allBadges } from '@/lib/mock-data';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BadgeGridProps {
  earnedBadgeIds: string[];
  showAll?: boolean;
}

const rarityColors: Record<string, string> = {
  common: 'border-zinc-600',
  rare: 'border-blue-500',
  epic: 'border-purple-500',
  legendary: 'border-amber-500',
};

export function BadgeGrid({ earnedBadgeIds, showAll = false }: BadgeGridProps) {
  const t = useTranslations('profile');
  const displayBadges = showAll ? allBadges : allBadges.filter((b) => earnedBadgeIds.includes(b.id));
  const lockedBadges = showAll ? [] : allBadges.filter((b) => !earnedBadgeIds.includes(b.id));

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold">{t('badges')}</h3>
      <TooltipProvider>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
          {displayBadges.map((badge) => (
            <Tooltip key={badge.id}>
              <TooltipTrigger asChild>
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-lg border-2 text-2xl transition-transform hover:scale-110 ${rarityColors[badge.rarity] ?? 'border-zinc-600'}`}
                >
                  {badge.icon}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold">{badge.name}</p>
                <p className="text-xs text-muted-foreground">{badge.description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          {lockedBadges.map((badge) => (
            <Tooltip key={badge.id}>
              <TooltipTrigger asChild>
                <div className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-muted text-2xl opacity-30 grayscale">
                  {badge.icon}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold">{badge.name}</p>
                <p className="text-xs text-muted-foreground">{badge.description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}
