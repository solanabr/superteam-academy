'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLeaderboard } from '@/lib/hooks/use-leaderboard';
import { useXp } from '@/lib/hooks/use-xp';
import { useCourseStore } from '@/lib/stores/course-store';
import { TimeFilter, type TimeRange } from '@/components/leaderboard/time-filter';
import { CourseFilter } from '@/components/leaderboard/course-filter';
import { PodiumTop3 } from '@/components/leaderboard/podium-top3';
import { LeaderboardTable } from '@/components/leaderboard/leaderboard-table';
import { YourRankSticky } from '@/components/leaderboard/your-rank-sticky';

export default function LeaderboardPage() {
  const t = useTranslations('leaderboard');
  const { publicKey } = useWallet();
  const { entries, userRank, isLoading, error, refresh } = useLeaderboard();
  const { xp, level } = useXp();

  const [timeRange, setTimeRange] = useState<TimeRange>('all_time');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const courses = useCourseStore((s) => s.courses);
  const fetchCourses = useCourseStore((s) => s.fetchCourses);

  // Ensure courses are loaded for the filter dropdown
  useEffect(() => {
    if (courses.length === 0) {
      fetchCourses();
    }
  }, [courses.length, fetchCourses]);

  const currentWallet = publicKey?.toBase58();

  // Course filter options derived from the course store
  const courseOptions = useMemo(
    () => courses.map((c) => ({ courseId: c.courseId, title: c.title })),
    [courses],
  );

  // Filter entries by course enrollment when a specific course is selected.
  // Since XP is global (not per-course), this is a cosmetic MVP filter:
  // it filters the leaderboard to wallets that enrolled in the selected course.
  // When enrollment data is unavailable for other wallets, we show all entries.
  const filteredEntries = useMemo(() => {
    if (selectedCourse === 'all') return entries;

    // We only have local enrollment data for the connected wallet.
    // Without a backend endpoint for per-wallet enrollment lookups,
    // the filter can only verify the connected user's enrollment.
    // For MVP, show all entries when a course is selected (the filter
    // signals intent for the future backend integration).
    return entries;
  }, [entries, selectedCourse]);

  // Split entries: top 3 for podium, rest for table
  const top3 = useMemo(() => filteredEntries.slice(0, 3), [filteredEntries]);
  const tableEntries = useMemo(() => filteredEntries.slice(3), [filteredEntries]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  const handleTimeRangeChange = useCallback(
    (range: TimeRange) => {
      setTimeRange(range);
      // The API currently returns all-time data.
      // When time-filtered endpoints are added, this will trigger a re-fetch.
      // For now, refresh to show the intent.
      void refresh();
    },
    [refresh],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compete with fellow learners and climb the ranks
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          className="gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw
            className={cn(
              'size-3.5',
              (isRefreshing || isLoading) && 'animate-spin',
            )}
          />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <TimeFilter
          activeFilter={timeRange}
          onChange={handleTimeRangeChange}
          totalParticipants={filteredEntries.length}
        />
        <CourseFilter
          courses={courseOptions}
          activeCourse={selectedCourse}
          onChange={setSelectedCourse}
        />
      </div>

      {/* Sentinel for sticky rank bar visibility detection */}
      <YourRankSticky rank={userRank} xp={xp} level={level} />

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <AlertCircle className="size-5 shrink-0 text-destructive" />
          <div className="flex-1">
            <p className="text-sm font-medium">Failed to load leaderboard</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Podium */}
      <PodiumTop3 entries={top3} isLoading={isLoading} />

      {/* Table for rank 4+ */}
      <LeaderboardTable
        entries={tableEntries}
        currentWallet={currentWallet}
        isLoading={isLoading}
      />

      {/* Bottom spacer to prevent sticky bar from overlapping content */}
      {userRank !== null && <div className="h-16" />}
    </div>
  );
}
