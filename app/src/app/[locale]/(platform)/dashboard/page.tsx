'use client';

import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { useUserStore } from '@/lib/stores/user-store';
import { useCourseStore } from '@/lib/stores/course-store';
import { useXp } from '@/lib/hooks/use-xp';
import { useStreak } from '@/lib/hooks/use-streak';
import { useLeaderboard } from '@/lib/hooks/use-leaderboard';
import { useAchievements } from '@/lib/hooks/use-achievements';
import { useCredentials } from '@/lib/hooks/use-credentials';
import { Skeleton } from '@/components/ui/skeleton';
import { WelcomeBanner } from '@/components/dashboard/welcome-banner';
import { QuickStats } from '@/components/dashboard/quick-stats';
import { ContinueLearning } from '@/components/dashboard/continue-learning';
import { RecentAchievements } from '@/components/dashboard/recent-achievements';
import { CredentialGallery } from '@/components/credentials/credential-gallery';
import { RecommendedCourses } from '@/components/dashboard/recommended-courses';
import { ActivityFeed } from '@/components/dashboard/activity-feed';

const ActivityHeatmap = dynamic(
  () => import('@/components/dashboard/activity-heatmap').then((m) => m.ActivityHeatmap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-40 w-full" />,
  },
);

export default function DashboardPage() {
  const { publicKey } = useWallet();
  const fetchUserData = useUserStore((s) => s.fetchUserData);
  const enrollments = useUserStore((s) => s.enrollments);
  const storeLoading = useUserStore((s) => s.isLoading);

  const { xp, level, progress, levelTitle, isLoading: xpLoading } = useXp();
  const { currentStreak, longestStreak, freezesAvailable, isFreezeActiveToday, useFreeze } = useStreak();
  const { userRank } = useLeaderboard();
  const { achievements, isLoading: achievementsLoading } = useAchievements();
  const { credentials, isLoading: credentialsLoading } = useCredentials();

  const courses = useCourseStore((s) => s.courses);
  const fetchCourses = useCourseStore((s) => s.fetchCourses);

  // Fetch user data when wallet connects
  useEffect(() => {
    if (publicKey) {
      fetchUserData(publicKey);
    }
  }, [publicKey, fetchUserData]);

  // Fetch course catalog for enrichment
  useEffect(() => {
    if (courses.length === 0) {
      fetchCourses();
    }
  }, [courses.length, fetchCourses]);

  const isLoading = storeLoading || xpLoading;

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Banner */}
      <WelcomeBanner
        level={level}
        levelTitle={levelTitle}
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        freezesAvailable={freezesAvailable}
        isFreezeActiveToday={isFreezeActiveToday}
        onUseFreeze={useFreeze}
        isLoading={isLoading}
      />

      {/* Stats Row */}
      <QuickStats
        xp={xp}
        xpProgress={progress}
        level={level}
        levelTitle={levelTitle}
        currentStreak={currentStreak}
        enrolledCount={enrollments.size}
        rank={userRank}
        isLoading={isLoading}
      />

      {/* Two-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left Column: Continue Learning + Activity */}
        <div className="flex flex-col gap-6">
          <ContinueLearning
            enrollments={enrollments}
            courses={courses}
            isLoading={isLoading}
          />
          <ActivityHeatmap />
          <ActivityFeed />
        </div>

        {/* Right Column: Achievements + Credentials + Recommended */}
        <div className="flex flex-col gap-6">
          <RecentAchievements
            achievements={achievements}
            isLoading={achievementsLoading}
          />
          <CredentialGallery
            credentials={credentials}
            isLoading={credentialsLoading}
          />
          <RecommendedCourses />
        </div>
      </div>
    </div>
  );
}
