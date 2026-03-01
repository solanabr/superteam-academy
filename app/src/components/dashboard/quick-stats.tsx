'use client';

import { Zap, Shield, Flame, BookOpen, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

interface QuickStatsProps {
  xp: number;
  xpProgress: number;
  level: number;
  levelTitle: string;
  currentStreak: number;
  enrolledCount: number;
  rank: number | null;
  isLoading: boolean;
  className?: string;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
  accent: string;
  iconBg: string;
  children?: React.ReactNode;
}

function StatCard({ icon, label, value, sublabel, accent, iconBg, children }: StatCardProps) {
  return (
    <Card className="group relative overflow-hidden py-0 transition-shadow hover:shadow-md">
      <CardContent className="flex items-start gap-4 p-4">
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110',
            iconBg,
          )}
        >
          {icon}
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className={cn('text-xl font-bold tabular-nums leading-none', accent)}>
            {value}
          </p>
          {sublabel && (
            <p className="text-[11px] text-muted-foreground">{sublabel}</p>
          )}
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="py-0">
      <CardContent className="flex items-start gap-4 p-4">
        <Skeleton className="size-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-2 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function QuickStats({
  xp,
  xpProgress,
  level,
  levelTitle,
  currentStreak,
  enrolledCount,
  rank,
  isLoading,
  className,
}: QuickStatsProps) {
  const t = useTranslations('gamification');
  const tLeaderboard = useTranslations('leaderboard');

  if (isLoading) {
    return (
      <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-5', className)}>
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-5', className)}>
      {/* Total XP */}
      <StatCard
        icon={<Zap className="size-5 text-yellow-600 dark:text-yellow-400" />}
        iconBg="bg-yellow-100 dark:bg-yellow-900/40"
        label={t('xp')}
        value={xp.toLocaleString()}
        accent="text-yellow-600 dark:text-yellow-400"
      >
        <Progress value={xpProgress} className="mt-1.5 h-1.5" />
      </StatCard>

      {/* Current Level */}
      <StatCard
        icon={<Shield className="size-5 text-blue-600 dark:text-blue-400" />}
        iconBg="bg-blue-100 dark:bg-blue-900/40"
        label={t('level')}
        value={level}
        sublabel={levelTitle}
        accent="text-blue-600 dark:text-blue-400"
      />

      {/* Day Streak */}
      <StatCard
        icon={
          <Flame
            className={cn(
              'size-5',
              currentStreak > 0
                ? 'text-orange-500'
                : 'text-muted-foreground',
            )}
            fill={currentStreak > 0 ? 'currentColor' : 'none'}
          />
        }
        iconBg={cn(
          currentStreak > 0
            ? 'bg-orange-100 dark:bg-orange-900/40'
            : 'bg-muted',
        )}
        label={t('streak')}
        value={currentStreak}
        accent={cn(
          currentStreak > 0
            ? 'text-orange-500'
            : 'text-muted-foreground',
        )}
      />

      {/* Courses Enrolled */}
      <StatCard
        icon={<BookOpen className="size-5 text-emerald-600 dark:text-emerald-400" />}
        iconBg="bg-emerald-100 dark:bg-emerald-900/40"
        label="Courses"
        value={enrolledCount}
        accent="text-emerald-600 dark:text-emerald-400"
      />

      {/* Leaderboard Rank */}
      <StatCard
        icon={<Trophy className="size-5 text-purple-600 dark:text-purple-400" />}
        iconBg="bg-purple-100 dark:bg-purple-900/40"
        label={tLeaderboard('rank')}
        value={rank !== null ? `#${rank}` : '—'}
        accent="text-purple-600 dark:text-purple-400"
      />
    </div>
  );
}
