'use client';

import { useCallback, useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLeaderboard } from '@/lib/hooks/use-leaderboard';
import { useXp } from '@/lib/hooks/use-xp';
import { TimeFilter, type TimeRange } from '@/components/leaderboard/time-filter';
import { PodiumTop3 } from '@/components/leaderboard/podium-top3';
import { LeaderboardTable } from '@/components/leaderboard/leaderboard-table';
import { YourRankSticky } from '@/components/leaderboard/your-rank-sticky';

export default function LeaderboardPage() {
  const t = useTranslations('leaderboard');
  const { publicKey } = useWallet();
  const { entries, userRank, isLoading, error, refresh } = useLeaderboard();
  const { xp, level } = useXp();

  const [timeRange, setTimeRange] = useState<TimeRange>('all_time');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentWallet = publicKey?.toBase58();

  // Split entries: top 3 for podium, rest for table
  const top3 = useMemo(() => entries.slice(0, 3), [entries]);
  const tableEntries = useMemo(() => entries.slice(3), [entries]);

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

      {/* Time Filter */}
      <TimeFilter
        activeFilter={timeRange}
        onChange={handleTimeRangeChange}
        totalParticipants={entries.length}
      />

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
