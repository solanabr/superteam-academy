'use client';

import { Trophy, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RecentAchievementsProps {
  achievements: string[];
  isLoading: boolean;
  className?: string;
}

/**
 * Achievement metadata lookup.
 * In production this would come from the backend/CMS.
 * For now we provide a deterministic mapping based on ID.
 */
const ACHIEVEMENT_META: Record<string, { name: string; description: string; color: string }> = {
  'first-lesson': {
    name: 'First Steps',
    description: 'Completed your first lesson',
    color: 'from-emerald-400 to-emerald-600',
  },
  'first-course': {
    name: 'Scholar',
    description: 'Completed your first course',
    color: 'from-blue-400 to-blue-600',
  },
  'streak-7': {
    name: 'On Fire',
    description: '7-day learning streak',
    color: 'from-orange-400 to-orange-600',
  },
  'streak-30': {
    name: 'Unstoppable',
    description: '30-day learning streak',
    color: 'from-red-400 to-red-600',
  },
  'xp-1000': {
    name: 'XP Hunter',
    description: 'Earned 1,000 XP',
    color: 'from-yellow-400 to-yellow-600',
  },
  'xp-5000': {
    name: 'XP Legend',
    description: 'Earned 5,000 XP',
    color: 'from-amber-400 to-amber-600',
  },
  'first-credential': {
    name: 'Certified',
    description: 'Earned your first credential NFT',
    color: 'from-violet-400 to-violet-600',
  },
  'all-beginner': {
    name: 'Foundation',
    description: 'Completed all beginner courses',
    color: 'from-teal-400 to-teal-600',
  },
};

function getAchievementMeta(id: string) {
  return (
    ACHIEVEMENT_META[id] ?? {
      name: id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      description: 'Achievement unlocked',
      color: 'from-zinc-400 to-zinc-600',
    }
  );
}

function AchievementBadge({ id }: { id: string }) {
  const meta = getAchievementMeta(id);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex flex-col items-center gap-1.5 group cursor-pointer">
          <div
            className={cn(
              'flex size-12 items-center justify-center rounded-full bg-gradient-to-br shadow-sm transition-transform group-hover:scale-110',
              meta.color,
            )}
          >
            <Trophy className="size-5 text-white" />
          </div>
          <span className="max-w-[72px] truncate text-center text-[10px] font-medium text-muted-foreground">
            {meta.name}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs font-medium">{meta.name}</p>
        <p className="text-[10px] text-muted-foreground">{meta.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function AchievementSkeleton() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <Skeleton className="size-12 rounded-full" />
      <Skeleton className="h-3 w-14" />
    </div>
  );
}

export function RecentAchievements({
  achievements,
  isLoading,
  className,
}: RecentAchievementsProps) {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');

  if (isLoading) {
    return (
      <Card className={cn('py-0', className)}>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm">{t('recent_achievements')}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex gap-4">
            <AchievementSkeleton />
            <AchievementSkeleton />
            <AchievementSkeleton />
            <AchievementSkeleton />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('py-0', className)}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{t('recent_achievements')}</CardTitle>
          <Button variant="ghost" size="xs" asChild>
            <Link href="/profile">
              {tCommon('view_all')}
              <ArrowRight className="size-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {achievements.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-6 text-center">
            <Trophy className="size-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">No achievements yet</p>
              <p className="text-xs text-muted-foreground">
                Complete lessons and courses to earn badges
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-2">
              {achievements.map((id) => (
                <AchievementBadge key={id} id={id} />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
