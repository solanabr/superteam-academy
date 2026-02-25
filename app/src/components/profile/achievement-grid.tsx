'use client';

import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AchievementBadge,
  type AchievementDefinition,
} from '@/components/profile/achievement-badge';

/**
 * Complete achievement catalog.
 * In production this would come from the backend/CMS;
 * here we provide the canonical set for deterministic rendering.
 */
export const ALL_ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first-lesson',
    name: 'First Steps',
    description: 'Completed your first lesson on the platform.',
    color: 'from-emerald-400 to-emerald-600',
  },
  {
    id: 'first-course',
    name: 'Scholar',
    description: 'Completed your first full course.',
    color: 'from-blue-400 to-blue-600',
  },
  {
    id: 'streak-7',
    name: 'On Fire',
    description: 'Maintained a 7-day consecutive learning streak.',
    color: 'from-orange-400 to-orange-600',
  },
  {
    id: 'streak-30',
    name: 'Unstoppable',
    description: 'Maintained a 30-day consecutive learning streak.',
    color: 'from-red-400 to-red-600',
  },
  {
    id: 'streak-100',
    name: 'Legendary Streak',
    description: 'Maintained a 100-day consecutive learning streak.',
    color: 'from-amber-500 to-red-700',
  },
  {
    id: 'xp-1000',
    name: 'XP Hunter',
    description: 'Accumulated 1,000 XP through lessons and challenges.',
    color: 'from-yellow-400 to-yellow-600',
  },
  {
    id: 'xp-5000',
    name: 'XP Legend',
    description: 'Accumulated 5,000 XP, proving dedication to the craft.',
    color: 'from-amber-400 to-amber-600',
  },
  {
    id: 'first-credential',
    name: 'Certified',
    description: 'Earned your first soulbound credential NFT.',
    color: 'from-violet-400 to-violet-600',
  },
  {
    id: 'all-beginner',
    name: 'Foundation',
    description: 'Completed all beginner-level courses.',
    color: 'from-teal-400 to-teal-600',
  },
  {
    id: 'defi-track',
    name: 'DeFi Degen',
    description: 'Completed the entire DeFi learning track.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'nft-track',
    name: 'NFT Creator',
    description: 'Completed the entire NFT learning track.',
    color: 'from-pink-400 to-rose-600',
  },
  {
    id: 'security-track',
    name: 'White Hat',
    description: 'Completed the entire Security learning track.',
    color: 'from-orange-500 to-red-600',
  },
  {
    id: 'core-track',
    name: 'Solana Native',
    description: 'Completed the entire Solana Core learning track.',
    color: 'from-purple-400 to-violet-600',
  },
];

interface AchievementGridProps {
  achievements: string[];
  allAchievements?: AchievementDefinition[];
  isLoading?: boolean;
  className?: string;
}

function AchievementSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 p-2">
      <Skeleton className="size-14 rounded-full" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function AchievementGrid({
  achievements,
  allAchievements = ALL_ACHIEVEMENTS,
  isLoading = false,
  className,
}: AchievementGridProps) {
  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6', className)}>
        {Array.from({ length: 8 }).map((_, i) => (
          <AchievementSkeleton key={i} />
        ))}
      </div>
    );
  }

  const earnedSet = new Set(achievements);
  const earned = allAchievements.filter((a) => earnedSet.has(a.id));
  const locked = allAchievements.filter((a) => !earnedSet.has(a.id));
  const sorted = [...earned, ...locked];

  if (allAchievements.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12 text-center', className)}>
        <Trophy className="size-10 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">No achievements available</p>
          <p className="text-xs text-muted-foreground">
            Achievements will appear here as they become available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6', className)}>
      {sorted.map((achievement) => (
        <AchievementBadge
          key={achievement.id}
          achievement={achievement}
          isEarned={earnedSet.has(achievement.id)}
        />
      ))}
    </div>
  );
}
