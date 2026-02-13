'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';
import { useI18n } from '@/components/i18n/i18n-provider';
import {
  getRegistrationRecord,
  REGISTRATION_CHANGED_EVENT
} from '@/lib/auth/registration-storage';
import { CourseSummary, LeaderboardEntry, StreakData } from '@/lib/types';
import { levelFromXP } from '@/lib/utils';

const emptyStreak: StreakData = {
  current: 0,
  longest: 0,
  lastActiveDate: '',
  activeDates: []
};

export function DashboardClient({ courses }: { courses: CourseSummary[] }): JSX.Element | null {
  const { dictionary } = useI18n();
  const { publicKey } = useWallet();
  const [registration, setRegistration] = useState<ReturnType<typeof getRegistrationRecord>>(null);
  const [ready, setReady] = useState<boolean>(false);
  const [xp, setXp] = useState<number>(0);
  const [streak, setStreak] = useState<StreakData>(emptyStreak);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    function syncRegistration(): void {
      setRegistration(getRegistrationRecord());
    }

    syncRegistration();
    setReady(true);

    window.addEventListener(REGISTRATION_CHANGED_EVENT, syncRegistration);
    return () => {
      window.removeEventListener(REGISTRATION_CHANGED_EVENT, syncRegistration);
    };
  }, []);

  const hasAccount = Boolean(registration);
  const userId = registration?.id ?? '';
  const xpLookupId = registration?.walletAddress ?? userId;

  useEffect(() => {
    if (!hasAccount) {
      setXp(0);
      setStreak(emptyStreak);
      setLeaderboard([]);
      setLoading(false);
      return;
    }

    let active = true;

    async function load(): Promise<void> {
      setLoading(true);

      try {
        const { learningProgressService } = await import('@/lib/services');
        const [nextXP, nextStreak, nextLeaderboard] = await Promise.all([
          learningProgressService.getXP(xpLookupId),
          learningProgressService.getStreak(userId),
          learningProgressService.getLeaderboard('alltime')
        ]);

        if (!active) {
          return;
        }

        setXp(nextXP);
        setStreak(nextStreak);
        setLeaderboard(nextLeaderboard);
      } catch {
        if (!active) {
          return;
        }

        setXp(0);
        setStreak(emptyStreak);
        setLeaderboard([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [hasAccount, userId, xpLookupId]);

  const currentRank = leaderboard.find((entry) => entry.userId === xpLookupId || entry.userId === userId)?.rank;
  const level = levelFromXP(xp);

  if (!ready) {
    return null;
  }

  if (!hasAccount) {
    return (
      <div data-testid="dashboard-no-account" className="panel mx-auto max-w-2xl space-y-4">
        <h1 className="text-3xl font-extrabold">{dictionary.dashboard.title}</h1>
        <p className="text-sm text-foreground/75">{dictionary.dashboard.noAccountDesc}</p>
        <div className="flex gap-2">
          <Link href="/register" data-testid="dashboard-register-link" className="btn-primary">
            {dictionary.actions.goToRegister}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="dashboard-page" className="space-y-6">
      <header data-testid="dashboard-header" className="panel relative overflow-hidden space-y-2">
        <div className="absolute -right-16 top-0 h-36 w-36 rounded-full bg-primary/12 blur-3xl" />
        <h1 className="text-3xl font-extrabold">{dictionary.dashboard.title}</h1>
        <p className="text-sm text-foreground/70">
          {publicKey
            ? `${dictionary.common.connectedWallet}: ${publicKey.toBase58().slice(0, 4)}...${publicKey
                .toBase58()
                .slice(-4)}`
            : registration?.walletAddress
              ? `${dictionary.dashboard.registeredWalletPrefix}: ${registration.walletAddress.slice(0, 4)}...${registration.walletAddress.slice(-4)}`
              : dictionary.dashboard.noWalletLinked}
        </p>
      </header>

      <section data-testid="dashboard-metrics" className="grid gap-4 md:grid-cols-4">
        <article data-testid="dashboard-metric-xp" className="panel-soft bg-card/70">
          <p className="text-xs text-foreground/70">{dictionary.dashboard.xpBalance}</p>
          <p className="mt-1 text-2xl font-bold text-primary">{loading ? dictionary.common.loading : xp}</p>
        </article>
        <article data-testid="dashboard-metric-level" className="panel-soft bg-card/70">
          <p className="text-xs text-foreground/70">{dictionary.dashboard.level}</p>
          <p className="mt-1 text-2xl font-bold text-primary">{loading ? dictionary.common.loading : level}</p>
        </article>
        <article data-testid="dashboard-metric-streak" className="panel-soft bg-card/70">
          <p className="text-xs text-foreground/70">{dictionary.dashboard.streak}</p>
          <p className="mt-1 text-2xl font-bold text-primary">
            {loading ? dictionary.common.loading : `${streak.current} ${dictionary.dashboard.daysLabel}`}
          </p>
        </article>
        <article data-testid="dashboard-metric-rank" className="panel-soft bg-card/70">
          <p className="text-xs text-foreground/70">{dictionary.dashboard.globalRank}</p>
          <p className="mt-1 text-2xl font-bold text-primary">
            {loading ? dictionary.common.loading : currentRank ? `#${currentRank}` : '-'}
          </p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="panel space-y-3 p-5">
          <h2 className="text-lg font-semibold">{dictionary.dashboard.currentCourses}</h2>
          {courses.length === 0 ? (
            <p className="text-sm text-foreground/75">{dictionary.dashboard.noCoursesPublished}</p>
          ) : (
            courses.map((course) => (
              <article key={course.id} className="panel-soft space-y-2 bg-background/45 p-3">
                <p className="text-sm font-medium">{course.title}</p>
                <p className="text-xs text-foreground/70">
                  {dictionary.dashboard.nextLessonAvailable} • {course.xpTotal} {dictionary.dashboard.xpTotalLabel}
                </p>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: '12%' }} />
                </div>
              </article>
            ))
          )}
        </div>

        <div className="panel space-y-3 p-5">
          <h2 className="text-lg font-semibold">{dictionary.dashboard.achievements}</h2>
          <p className="panel-soft text-sm text-foreground/75">{dictionary.dashboard.noAchievements}</p>

          <h3 className="pt-2 text-sm font-semibold">{dictionary.dashboard.streakCalendar}</h3>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 28 }).map((_, index) => {
              const active = index >= 28 - streak.current;
              return <div key={index} className={`h-4 rounded ${active ? 'bg-primary' : 'bg-muted'}`} />;
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
