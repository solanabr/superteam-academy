'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useI18n } from '@/components/i18n/i18n-provider';
import { learningProgressService } from '@/lib/services';
import { CourseSummary, LeaderboardEntry, Timeframe } from '@/lib/types';

const timeframeOptions: Timeframe[] = ['alltime', 'monthly', 'weekly'];

export function LeaderboardClient({ courses }: { courses: CourseSummary[] }): JSX.Element {
  const { dictionary } = useI18n();
  const { publicKey } = useWallet();
  const [timeframe, setTimeframe] = useState<Timeframe>('alltime');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    async function load(): Promise<void> {
      setLoading(true);
      const response = await learningProgressService.getLeaderboard(timeframe);
      let filteredRows = response;

      if (courseFilter !== 'all') {
        const progressByEntry = await Promise.all(
          response.map((entry) => learningProgressService.getProgress(entry.userId, courseFilter))
        );

        filteredRows = response.filter((_, index) => {
          const progress = progressByEntry[index];
          return progress.percentage > 0 || progress.completedLessonIndexes.length > 0 || progress.xpEarned > 0;
        });
      }

      if (!active) {
        return;
      }

      setRows(
        filteredRows.map((entry, index) => ({
          ...entry,
          rank: index + 1
        }))
      );
      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [courseFilter, timeframe]);

  const highlightedUser = publicKey?.toBase58();

  return (
    <div data-testid="leaderboard-page" className="space-y-6">
      <header data-testid="leaderboard-header" className="panel flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">{dictionary.leaderboard.title}</h1>
          <p className="text-sm text-foreground/75">{dictionary.leaderboard.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div data-testid="leaderboard-timeframe-switcher" className="inline-flex rounded-full border border-border/80 bg-background/60 p-1 text-xs">
            {timeframeOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTimeframe(option)}
                className={`rounded-full px-3 py-1 font-semibold ${
                  timeframe === option ? 'bg-primary text-primary-foreground' : 'text-foreground/80 hover:bg-muted/70'
                }`}
              >
                {option === 'alltime'
                  ? dictionary.leaderboard.alltime
                  : option === 'monthly'
                    ? dictionary.leaderboard.monthly
                    : dictionary.leaderboard.weekly}
              </button>
            ))}
          </div>

          <select
            value={courseFilter}
            onChange={(event) => setCourseFilter(event.target.value)}
            className="rounded-full border border-border/80 bg-background/60 px-3 py-1.5 text-xs"
          >
            <option value="all">{dictionary.common.allCourses}</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
      </header>

      <section data-testid="leaderboard-list" className="panel space-y-2 p-4">
        {loading ? (
          <p className="text-sm text-foreground/70">{dictionary.leaderboard.loading}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-foreground/70">{dictionary.leaderboard.empty}</p>
        ) : (
          rows.map((entry) => {
            const isCurrent = highlightedUser ? entry.userId === highlightedUser : false;
            return (
              <article
                key={entry.userId}
                className={`grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 rounded-xl border border-border/50 px-3 py-2 text-sm ${
                  entry.rank === 1 ? 'bg-amber-500/10' : 'bg-background/45'
                } ${isCurrent ? 'ring-2 ring-primary/40' : ''}`}
              >
                <p className={`font-mono text-xs ${entry.rank <= 3 ? 'text-primary' : ''}`}>#{entry.rank}</p>
                <p className="font-medium">{entry.username}</p>
                <p className="font-semibold">{entry.xp} XP</p>
                <p className="text-foreground/80">{`${dictionary.leaderboard.levelShort} ${entry.level}`}</p>
                <p className="text-foreground/80">{`${entry.streak}${dictionary.common.daysShort} ${dictionary.leaderboard.streakShort}`}</p>
              </article>
            );
          })
        )}
      </section>

      {courseFilter !== 'all' ? (
        <p className="text-xs text-foreground/65">{dictionary.leaderboard.courseFilterNote}</p>
      ) : null}
    </div>
  );
}
