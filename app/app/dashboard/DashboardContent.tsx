'use client';

import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';
import { courses } from '@/lib/data/courses';
import { ACHIEVEMENT_DEFINITIONS } from '@/lib/data/achievements';
import { learningProgressService, xpToLevel } from '@/lib/services/learning-progress';
import { getStreakData } from '@/lib/services/streak';
import { useI18n } from '@/lib/i18n/context';
import { StreakCalendar } from '@/components/StreakCalendar';
import type { XPBalance, Credential, StreakData, AchievementReceipt } from '@/lib/services/types';

export function DashboardContent() {
  const { publicKey } = useWallet();
  const { t } = useI18n();
  const [xpBalance, setXpBalance] = useState<XPBalance | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [achievements, setAchievements] = useState<AchievementReceipt[]>([]);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [progress, setProgress] = useState<Record<string, string[]> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!publicKey) {
      setXpBalance(null);
      setCredentials([]);
      setAchievements([]);
      setStreak(null);
      setProgress(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const wallet = publicKey.toBase58();
    Promise.all([
      learningProgressService.getXPBalance(wallet),
      learningProgressService.getCredentials(wallet),
      learningProgressService.getProgress(wallet),
      learningProgressService.getAchievements(wallet),
    ]).then(([xp, creds, p, ach]) => {
      setXpBalance(xp);
      setCredentials(creds);
      setProgress(p.completedLessons);
      setAchievements(ach);
      setLoading(false);
    });
    setStreak(getStreakData(wallet));
  }, [publicKey]);

  if (!publicKey) {
    return (
      <section className="rounded-2xl border border-border/50 bg-surface p-10 text-center" aria-labelledby="dashboard-connect-heading">
        <div className="mx-auto max-w-md">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent/20 text-2xl" aria-hidden>
            🔗
          </div>
          <h2 id="dashboard-connect-heading" className="text-title mb-2 font-semibold text-[rgb(var(--text))]">
            {t('dashboardConnect')}
          </h2>
          <p className="text-body text-[rgb(var(--text-muted))]">
            {t('dashboardConnectDesc')}
          </p>
          <Link
            href="/courses"
            className="text-body mt-6 inline-flex items-center gap-2 font-medium text-accent no-underline hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg-page))] focus-visible:outline-none rounded-md"
          >
            {t('browseCourses')} →
          </Link>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8" aria-busy="true" aria-label="Loading dashboard">
        <section className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-surface p-5 shadow-card animate-pulse">
              <div className="h-4 w-24 rounded bg-surface-elevated" />
              <div className="mt-3 h-8 w-20 rounded bg-surface-elevated" />
              <div className="mt-2 h-3 w-full rounded bg-surface-elevated" />
            </div>
          ))}
        </section>
        <section className="rounded-2xl border border-border/50 bg-surface p-6 sm:p-8">
          <div className="h-5 w-32 rounded bg-surface-elevated" />
          <div className="mt-4 flex items-baseline gap-3">
            <div className="h-10 w-16 rounded bg-surface-elevated" />
            <div className="h-4 flex-1 rounded bg-surface-elevated" />
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-surface-elevated" />
        </section>
        <section>
          <div className="h-6 w-40 rounded bg-surface-elevated animate-skeleton-pulse" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 rounded-xl border border-border/50 bg-surface animate-skeleton-pulse" />
            ))}
          </div>
        </section>
      </div>
    );
  }

  const completed = progress ?? {};
  const totalLessons = courses.reduce((s, c) => s + c.lessons.length, 0);
  const completedCount = Object.values(completed).flat().length;
  const overallPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const xp = xpBalance?.xp ?? 0;
  const level = xpBalance?.level ?? xpToLevel(0);
  const nextLevelXP = (level + 1) * (level + 1) * 100;
  const currentLevelStartXP = level * level * 100;
  const xpInCurrentLevel = xp - currentLevelStartXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelStartXP;
  const levelProgressPercent = xpNeededForNextLevel > 0
    ? Math.min(100, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100))
    : 100;

  return (
    <div className="space-y-8">
      {/* Level progress bar — XP to next level */}
      <section className="rounded-xl border border-border/50 bg-surface p-5 shadow-card" aria-labelledby="level-progress-heading">
        <h2 id="level-progress-heading" className="text-caption font-medium uppercase tracking-wider text-[rgb(var(--text-muted))] sr-only">
          Level progress
        </h2>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-body font-semibold text-[rgb(var(--text))]">Level {level}</p>
            <p className="text-caption text-[rgb(var(--text-muted))]">
              {xp} / {nextLevelXP} XP to Level {level + 1}
            </p>
          </div>
          <div className="min-w-[120px] flex-1 max-w-xs">
            <div
              className="h-2 rounded-full bg-surface-elevated overflow-hidden"
              role="progressbar"
              aria-valuenow={levelProgressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="XP progress to next level"
            >
              <div
                className="h-full rounded-full bg-chart-2 transition-all duration-500"
                style={{ width: `${levelProgressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* XP & Level — on-chain: Token-2022 balance; Level = floor(sqrt(xp/100)) */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border/50 bg-surface p-5 shadow-card">
          <p className="text-caption font-medium uppercase tracking-wider text-[rgb(var(--text-muted))]">
            XP balance
          </p>
          <p className="text-display mt-1 font-semibold text-accent">{xp} XP</p>
          <p className="text-caption mt-1 text-[rgb(var(--text-subtle))]">
            Soulbound Token-2022 · Devnet
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-surface p-5 shadow-card">
          <p className="text-caption font-medium uppercase tracking-wider text-[rgb(var(--text-muted))]">
            Level
          </p>
          <p className="text-display mt-1 font-semibold text-chart-2">Level {level}</p>
          <p className="text-caption mt-1 text-[rgb(var(--text-subtle))]">
            Next: {nextLevelXP} XP
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-surface p-5 shadow-card">
          <p className="text-caption font-medium uppercase tracking-wider text-[rgb(var(--text-muted))]">
            Streak
          </p>
          <p className="text-display mt-1 font-semibold text-chart-3">
            {streak?.currentStreak ?? 0} days
          </p>
          <p className="text-caption mt-1 text-[rgb(var(--text-subtle))]">
            Longest: {streak?.longestStreak ?? 0} · Frontend-only
          </p>
        </div>
      </section>

      {streak && (
        <section aria-label="Streak history calendar">
          <StreakCalendar data={streak} />
        </section>
      )}

      {/* Achievements / badges — all definitions with locked vs unlocked */}
      <section>
        <h2 className="text-title mb-4 font-semibold text-[rgb(var(--text))]">
          Achievements
        </h2>
        <p className="text-caption mb-4 text-[rgb(var(--text-muted))]">
          Unlock badges by completing lessons, keeping streaks, and finishing courses.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {ACHIEVEMENT_DEFINITIONS.slice(0, 8).map((def) => {
            const unlocked = achievements.some((a) => a.achievementId === def.id);
            return (
              <div
                key={def.id}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                  unlocked
                    ? 'border-border/50 bg-surface'
                    : 'border-border/40 bg-surface/60 opacity-75'
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
                    unlocked ? 'bg-chart-3/20' : 'bg-surface-elevated'
                  }`}
                  aria-hidden
                >
                  {unlocked ? '🏅' : '🔒'}
                </span>
                <div className="min-w-0">
                  <p className={`text-body font-medium ${unlocked ? 'text-[rgb(var(--text))]' : 'text-[rgb(var(--text-muted))]'}`}>
                    {def.name}
                  </p>
                  <p className="text-caption text-[rgb(var(--text-subtle))]">
                    +{def.xpReward} XP · {def.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Overall progress */}
      <section className="rounded-2xl border border-border/50 bg-surface p-6 sm:p-8">
        <h2 className="text-body mb-4 font-semibold text-[rgb(var(--text))]">
          Overall progress
        </h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-accent">{overallPercent}%</span>
            <span className="text-body text-[rgb(var(--text-muted))]">
              {completedCount} of {totalLessons} lessons completed
            </span>
          </div>
        </div>
        <div
          className="mt-4 h-3 overflow-hidden rounded-full bg-surface-elevated"
          role="progressbar"
          aria-valuenow={overallPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Overall course progress"
        >
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${overallPercent}%` }}
          />
        </div>
      </section>

      {/* Credentials — Metaplex Core NFTs, soulbound */}
      <section>
        <h2 className="text-title mb-4 font-semibold text-[rgb(var(--text))]">
          On-chain credentials
        </h2>
        {credentials.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {credentials.map((c) => (
              <div
                key={c.mint}
                className="rounded-xl border border-border/50 bg-surface p-5"
              >
                <p className="text-body font-medium text-[rgb(var(--text))]">{c.track}</p>
                <p className="text-caption text-[rgb(var(--text-muted))]">
                  Level {c.level} · {c.coursesCompleted} courses · {c.totalXp} XP
                </p>
                {c.verificationUrl && (
                  <a
                    href={c.verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-caption mt-2 inline-block text-accent hover:underline"
                  >
                    Verify on Solana Explorer →
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 border-dashed bg-surface/50 p-8 text-center">
            <p className="text-body text-[rgb(var(--text-muted))]">
              No credentials yet. Complete courses to earn on-chain credentials.
            </p>
          </div>
        )}
      </section>

      {/* Recommended next courses — incomplete courses with next lesson */}
      {(() => {
        const recommended = courses
          .map((course) => {
            const completedInCourse = (completed[course.id] ?? []).length;
            const coursePercent = course.lessons.length > 0
              ? Math.round((completedInCourse / course.lessons.length) * 100)
              : 0;
            const nextLesson = coursePercent < 100 ? course.lessons[completedInCourse] : null;
            return { course, coursePercent, nextLesson };
          })
          .filter((r) => r.coursePercent < 100 && r.nextLesson)
          .slice(0, 2);
        if (recommended.length === 0) return null;
        return (
          <section>
            <h2 className="text-title mb-4 font-semibold text-[rgb(var(--text))]">
              Recommended next
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {recommended.map(({ course, nextLesson }) => (
                <Link
                  key={course.id}
                  href={nextLesson ? `/courses/${course.slug}/lessons/${nextLesson.id}` : `/courses/${course.slug}`}
                  className="block rounded-xl border border-border/50 bg-surface p-5 transition hover:border-accent/40 hover:shadow-card-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <p className="text-body font-semibold text-[rgb(var(--text))]">{course.title}</p>
                  {nextLesson && (
                    <p className="text-caption mt-1 font-medium text-accent">Continue: {nextLesson.title} →</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        );
      })()}

      {/* Recent activity — stub: last completions (no timestamps; show sample) */}
      <section>
        <h2 className="text-title mb-4 font-semibold text-[rgb(var(--text))]">
          Recent activity
        </h2>
        <div className="rounded-xl border border-border/50 bg-surface p-5">
          {completedCount > 0 ? (
            <ul className="space-y-2 text-caption text-[rgb(var(--text-muted))]" aria-label="Recent completions">
              {courses
                .flatMap((c) => {
                  const ids = completed[c.id] ?? [];
                  const lastId = ids[ids.length - 1];
                  const lesson = lastId ? c.lessons.find((l) => l.id === lastId) : null;
                  return lesson ? [{ course: c, lesson }] : [];
                })
                .slice(-3)
                .reverse()
                .map(({ course, lesson }) => (
                  <li key={`${course.id}-${lesson.id}`}>Completed &quot;{lesson.title}&quot; in {course.title}</li>
                ))}
              {completedCount > 3 && <li className="text-[rgb(var(--text-subtle))]">… and more</li>}
            </ul>
          ) : (
            <p className="text-caption text-[rgb(var(--text-muted))]">Complete a lesson to see activity here.</p>
          )}
        </div>
      </section>

      {/* Recommended next courses — prioritize not started or lowest progress */}
      {(() => {
        const withPercent = courses.map((c) => {
          const done = (completed[c.id] ?? []).length;
          const pct = c.lessons.length ? Math.round((done / c.lessons.length) * 100) : 0;
          return { course: c, percent: pct };
        });
        const recommended = withPercent.filter((x) => x.percent < 100).sort((a, b) => a.percent - b.percent).slice(0, 3);
        if (recommended.length === 0) return null;
        return (
          <section className="rounded-xl border border-border/50 bg-surface p-5">
            <h2 className="text-body mb-3 font-semibold text-[rgb(var(--text))]">
              Recommended next
            </h2>
            <p className="text-caption text-[rgb(var(--text-muted))]">
              Continue where you left off or start a new course.
            </p>
            <ul className="mt-3 space-y-2">
              {recommended.map(({ course, percent }) => {
                const done = (completed[course.id] ?? []).length;
                const nextLesson = course.lessons[done];
                return (
                  <li key={course.id}>
                    <Link
                      href={nextLesson ? `/courses/${course.slug}/lessons/${nextLesson.id}` : `/courses/${course.slug}`}
                      className="flex items-center justify-between rounded-lg border border-border/40 bg-surface-elevated/50 px-3 py-2 text-caption transition hover:border-accent/40 hover:bg-surface-elevated focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg-page))] focus-visible:outline-none"
                    >
                      <span className="font-medium text-[rgb(var(--text))]">{course.title}</span>
                      <span className="text-[rgb(var(--text-subtle))]">{percent}% · Next →</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })()}

      {/* Recent activity feed — stub: no timestamps; show completions per course */}
      {(() => {
        const activityItems: { courseTitle: string; lessonTitle: string }[] = [];
        courses.forEach((c) => {
          const doneIds = completed[c.id] ?? [];
          if (doneIds.length > 0) {
            const lastId = doneIds[doneIds.length - 1];
            const lesson = c.lessons.find((l) => l.id === lastId);
            if (lesson) activityItems.push({ courseTitle: c.title, lessonTitle: lesson.title });
          }
        });
        const recent = activityItems.slice(-5).reverse();
        if (recent.length === 0) return null;
        return (
          <section className="rounded-xl border border-border/50 bg-surface p-5">
            <h2 className="text-body mb-3 font-semibold text-[rgb(var(--text))]">
              Recent activity
            </h2>
            <ul className="space-y-2 text-caption text-[rgb(var(--text-muted))]" role="list">
              {recent.map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-success" aria-hidden>✓</span>
                  Completed &quot;{item.lessonTitle}&quot; in {item.courseTitle}
                </li>
              ))}
            </ul>
          </section>
        );
      })()}

      {/* Per-course progress */}
      <section>
        <h2 className="text-title mb-4 font-semibold text-[rgb(var(--text))]">
          Courses
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((course) => {
            const completedInCourse = (completed[course.id] ?? []).length;
            const coursePercent =
              course.lessons.length > 0
                ? Math.round((completedInCourse / course.lessons.length) * 100)
                : 0;
            const nextLesson = coursePercent < 100 ? course.lessons[completedInCourse] : null;
            return (
              <Link
                key={course.id}
                href={nextLesson ? `/courses/${course.slug}/lessons/${nextLesson.id}` : `/courses/${course.slug}`}
                className="group block rounded-xl border border-border/50 bg-surface p-5 transition hover:border-accent/40 hover:shadow-card-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg-page))] focus-visible:outline-none"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-body font-semibold text-[rgb(var(--text))] group-hover:text-accent">
                    {course.title}
                  </h3>
                  <span className="text-caption font-medium text-accent">
                    {coursePercent}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-elevated">
                  <div
                    className="h-full rounded-full bg-accent/80 transition-all duration-300"
                    style={{ width: `${coursePercent}%` }}
                  />
                </div>
                <p className="text-caption mt-2 text-[rgb(var(--text-muted))]">
                  {completedInCourse} of {course.lessons.length} lessons · {course.duration}
                </p>
                {nextLesson && (
                  <p className="text-caption mt-1 font-medium text-accent">
                    Next: {nextLesson.title} →
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
