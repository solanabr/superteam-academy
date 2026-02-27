'use client';

import { useGamification } from '@/hooks/useGamification';
import {
  XPDisplay,
  LevelBadge,
  StreakDisplay,
  StreakReminder,
  AchievementProgress,
  AchievementGrid,
  AchievementUnlockModal,
  LeaderboardMini,
  GamificationHeader,
  DisplayAchievement,
  createDisplayAchievements,
} from '@/components/gamification';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { UserAchievement, Achievement, ACHIEVEMENTS } from '@/types/gamification';
import { useState, useMemo } from 'react';
import { Award, ChevronRight, RefreshCw, Flame, Trophy } from 'lucide-react';
import Link from 'next/link';
import { getLucideIcon } from '@/lib/icon-utils';

interface DashboardGamificationWidgetProps {
  userId: string;
  showLeaderboard?: boolean;
  showAchievements?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Gamification widget for the dashboard
 * Displays XP, level, streak, achievements, and leaderboard
 */
export function DashboardGamificationWidget({
  userId,
  showLeaderboard = true,
  showAchievements = true,
  compact = false,
  className = '',
}: DashboardGamificationWidgetProps) {
  const { xp, streak, achievements, leaderboard, userRank, isLoading, error, refetch } =
    useGamification();

  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);

  // Create display achievements by merging user achievements with achievement metadata
  const displayAchievements = useMemo(
    () => createDisplayAchievements(achievements, ACHIEVEMENTS),
    [achievements]
  );

  // Show unlock modal for new achievements
  const handleNewAchievements = (newAchievements: UserAchievement[]) => {
    if (newAchievements.length > 0) {
      // Find the full achievement data
      const achievement = ACHIEVEMENTS.find((a) => a.id === newAchievements[0].achievementId);
      if (achievement) {
        setUnlockedAchievement(achievement);
      }
    }
  };

  if (isLoading) {
    return <GamificationSkeleton compact={compact} className={className} />;
  }

  if (error) {
    return (
      <Card className={`border-red-500/30 bg-red-900/20 ${className}`}>
        <CardContent className="py-4">
          <p className="mb-2 text-sm text-red-400">Failed to load gamification data</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!xp || !streak) {
    return null;
  }

  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;

  if (compact) {
    return (
      <div className={`space-y-3 ${className}`}>
        <GamificationHeader xp={xp} streak={streak} />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* XP & Level Progress */}
      <XPDisplay xp={xp} showDetails size="md" />

      {/* Current Streak */}
      <StreakDisplay streak={streak} size="sm" showCalendar />
      <StreakReminder
        lastActivityDate={streak.lastActivityDate ? new Date(streak.lastActivityDate) : null}
      />

      {/* Achievement Progress */}
      {showAchievements && (
        <Card className="border-gray-700 bg-gray-900/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="h-4 w-4 text-yellow-400" />
                Achievements
              </CardTitle>
              <CardDescription>
                {unlockedCount}/{achievements.length}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <AchievementProgress
              unlocked={unlockedCount}
              total={displayAchievements.length}
              className="mb-3"
            />
            {/* Show recent unlocked achievements */}
            <div className="flex flex-wrap gap-2">
              {displayAchievements
                .filter((a) => a.unlockedAt)
                .slice(0, 5)
                .map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex h-8 w-8 items-center justify-center rounded bg-gray-800 text-lg"
                    title={achievement.name}
                  >
                    {(() => {
                      const Icon = getLucideIcon(achievement.icon);
                      return <Icon className="h-4 w-4" />;
                    })()}
                  </div>
                ))}
              {unlockedCount > 5 && (
                <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-800 text-xs text-gray-400">
                  +{unlockedCount - 5}
                </div>
              )}
            </div>
            <Button variant="ghost" className="mt-3 w-full" size="sm" asChild>
              <Link href="/profile#achievements">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Mini Leaderboard */}
      {showLeaderboard && leaderboard.length > 0 && (
        <LeaderboardMini entries={leaderboard.slice(0, 3)} currentUserId={userId} />
      )}

      {/* Achievement Unlock Modal */}
      {unlockedAchievement && (
        <AchievementUnlockModal
          achievement={unlockedAchievement}
          onClose={() => setUnlockedAchievement(null)}
        />
      )}
    </div>
  );
}

interface GamificationSkeletonProps {
  compact?: boolean;
  className?: string;
}

function GamificationSkeleton({ compact = false, className = '' }: GamificationSkeletonProps) {
  if (compact) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-lg" />
    </div>
  );
}

/**
 * XP Progress Card for dashboard stats grid
 */
export function XPProgressCard({ className = '' }: { className?: string }) {
  const { xp, isLoading } = useGamification();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <Skeleton className="mb-2 h-6 w-20" />
          <Skeleton className="h-8 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (!xp) return null;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">Total XP</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <LevelBadge level={xp.level} size="md" />
          <div>
            <div className="text-2xl font-bold">{xp.total.toLocaleString()}</div>
            <div className="text-muted-foreground text-xs">Level {xp.level}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Streak Card for dashboard stats grid
 */
export function StreakCard({ className = '' }: { className?: string }) {
  const { streak, isLoading } = useGamification();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <Skeleton className="mb-2 h-6 w-20" />
          <Skeleton className="h-8 w-24" />
        </CardContent>
      </Card>
    );
  }

  if (!streak) return null;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">Current Streak</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <Flame className="h-6 w-6 text-orange-400" />
          <div className="text-2xl font-bold text-orange-400">{streak.currentStreak}</div>
          <span className="text-muted-foreground">days</span>
        </div>
        <div className="text-muted-foreground mt-1 text-xs">Best: {streak.longestStreak} days</div>
      </CardContent>
    </Card>
  );
}

/**
 * Rank Card for dashboard stats grid
 */
export function RankCard({ className = '' }: { className?: string }) {
  const { userRank, isLoading } = useGamification();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <Skeleton className="mb-2 h-6 w-20" />
          <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          <div className="text-2xl font-bold">#{userRank || '-'}</div>
        </div>
        <Button variant="link" className="h-auto p-0 text-xs" asChild>
          <Link href="/leaderboard">View Rankings</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
