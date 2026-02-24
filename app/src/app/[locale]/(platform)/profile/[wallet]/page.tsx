'use client';

import { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
// Wallet context provided by layout
import { PublicKey } from '@solana/web3.js';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useUserStore } from '@/lib/stores/user-store';
import { useCourseStore } from '@/lib/stores/course-store';
import { useXp } from '@/lib/hooks/use-xp';
import { useStreak } from '@/lib/hooks/use-streak';
import { useAchievements } from '@/lib/hooks/use-achievements';
import { useCredentials } from '@/lib/hooks/use-credentials';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileHeader } from '@/components/profile/profile-header';
import { StatsSummary, type ProfileStats } from '@/components/profile/stats-summary';
import type { SkillAxis } from '@/components/profile/skill-radar';
import { AchievementGrid } from '@/components/profile/achievement-grid';
import { CompletedCoursesList } from '@/components/profile/completed-courses-list';
import { CredentialGallery } from '@/components/credentials/credential-gallery';

const SkillRadar = dynamic(
  () => import('@/components/profile/skill-radar').then((m) => m.SkillRadar),
  {
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full" />,
  },
);

/**
 * Track ID to label mapping for skill radar.
 * Must align with the track-badge component's TRACK_MAP.
 */
const TRACK_LABELS: Record<number, string> = {
  1: 'Solana Core',
  2: 'DeFi',
  3: 'NFT',
  4: 'Security',
};

/**
 * Maximum courses per track (used for radar normalization).
 * In production this would come from the course catalog.
 */
const MAX_COURSES_PER_TRACK = 10;

export default function ProfilePage() {
  const params = useParams<{ wallet: string }>();
  const walletAddress = params.wallet;
  const tProfile = useTranslations('profile');

  // Store selectors
  const fetchUserData = useUserStore((s) => s.fetchUserData);
  const enrollments = useUserStore((s) => s.enrollments);
  const storeLoading = useUserStore((s) => s.isLoading);
  const storeError = useUserStore((s) => s.error);

  // Hooks (these read from the store, which is populated via fetchUserData)
  const { xp, level, progress, levelTitle, isLoading: xpLoading } = useXp();
  const { currentStreak, longestStreak } = useStreak();
  const { achievements, isLoading: achievementsLoading } = useAchievements();
  const { credentials, isLoading: credentialsLoading } = useCredentials();

  // Course catalog
  const courses = useCourseStore((s) => s.courses);
  const fetchCourses = useCourseStore((s) => s.fetchCourses);

  // Fetch user data for the wallet in the URL
  useEffect(() => {
    if (!walletAddress) return;

    try {
      const pk = new PublicKey(walletAddress);
      fetchUserData(pk);
    } catch {
      // Invalid wallet address - store will remain in default state
    }
  }, [walletAddress, fetchUserData]);

  // Fetch course catalog for enrichment
  useEffect(() => {
    if (courses.length === 0) {
      fetchCourses();
    }
  }, [courses.length, fetchCourses]);

  const isLoading = storeLoading || xpLoading;

  // Compute derived stats
  const stats = useMemo((): ProfileStats => {
    let coursesCompleted = 0;
    let coursesInProgress = 0;
    let lessonsCompleted = 0;

    for (const enrollment of enrollments.values()) {
      lessonsCompleted += enrollment.completedLessons;
      if (enrollment.isFinalized) {
        coursesCompleted++;
      } else if (enrollment.completedLessons > 0) {
        coursesInProgress++;
      }
    }

    return {
      totalXp: xp,
      level,
      levelTitle,
      xpProgress: progress,
      coursesEnrolled: enrollments.size,
      coursesCompleted,
      coursesInProgress,
      lessonsCompleted,
      credentialsEarned: credentials.length,
      achievementCount: achievements.length,
      currentStreak,
      longestStreak,
    };
  }, [
    enrollments,
    xp,
    level,
    levelTitle,
    progress,
    credentials.length,
    achievements.length,
    currentStreak,
    longestStreak,
  ]);

  // Compute skill radar data from enrollments + courses
  const skillAxes = useMemo((): SkillAxis[] => {
    const trackCounts = new Map<number, number>();

    for (const [courseId, enrollment] of enrollments) {
      if (!enrollment.isFinalized) continue;
      const course = courses.find((c) => c.courseId === courseId);
      if (!course) continue;

      const current = trackCounts.get(course.trackId) ?? 0;
      trackCounts.set(course.trackId, current + 1);
    }

    // Build axes for all known tracks
    return Object.entries(TRACK_LABELS).map(([idStr, label]) => {
      const trackId = Number(idStr);
      return {
        track: label,
        value: trackCounts.get(trackId) ?? 0,
        max: MAX_COURSES_PER_TRACK,
      };
    });
  }, [enrollments, courses]);

  // Compute completed courses count for header
  const coursesCompletedCount = useMemo(() => {
    let count = 0;
    for (const enrollment of enrollments.values()) {
      if (enrollment.isFinalized) count++;
    }
    return count;
  }, [enrollments]);

  // Validate wallet address
  const isValidWallet = useMemo(() => {
    try {
      new PublicKey(walletAddress);
      return true;
    } catch {
      return false;
    }
  }, [walletAddress]);

  if (!isValidWallet) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <span className="text-2xl">!</span>
        </div>
        <div>
          <p className="text-lg font-semibold">Invalid Wallet Address</p>
          <p className="text-sm text-muted-foreground">
            The wallet address in the URL is not a valid Solana address.
          </p>
        </div>
      </div>
    );
  }

  if (storeError && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <span className="text-2xl">!</span>
        </div>
        <div>
          <p className="text-lg font-semibold">Failed to Load Profile</p>
          <p className="text-sm text-muted-foreground">{storeError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Profile Header */}
      <ProfileHeader
        wallet={walletAddress}
        xp={xp}
        level={level}
        levelTitle={levelTitle}
        xpProgress={progress}
        streak={currentStreak}
        coursesCompleted={coursesCompletedCount}
        isLoading={isLoading}
      />

      {/* Tabbed Content */}
      <Tabs defaultValue="overview">
        <TabsList variant="line" className="w-full sm:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">
            {tProfile('achievements')}
          </TabsTrigger>
          <TabsTrigger value="credentials">
            {tProfile('credentials')}
          </TabsTrigger>
          <TabsTrigger value="courses">
            {tProfile('completed_courses')}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <StatsSummary stats={stats} isLoading={isLoading} />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">{tProfile('skills')}</h3>
              <div className="rounded-xl border bg-card p-4">
                <SkillRadar skills={skillAxes} />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">{tProfile('achievements')}</h3>
              <div className="rounded-xl border bg-card p-4">
                <AchievementGrid
                  achievements={achievements}
                  isLoading={achievementsLoading}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="mt-4">
          <AchievementGrid
            achievements={achievements}
            isLoading={achievementsLoading}
          />
        </TabsContent>

        {/* Credentials Tab */}
        <TabsContent value="credentials" className="mt-4">
          <CredentialGallery
            credentials={credentials}
            isLoading={credentialsLoading}
          />
        </TabsContent>

        {/* Completed Courses Tab */}
        <TabsContent value="courses" className="mt-4">
          <CompletedCoursesList
            enrollments={enrollments}
            courses={courses}
            credentials={credentials}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
