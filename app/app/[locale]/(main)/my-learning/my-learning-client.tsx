"use client";

import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCourses } from "@/hooks/use-courses";
import { useXpBalance } from "@/hooks/use-xp-balance";
import { XpDisplay } from "@/components/xp/xp-display";
import { LevelProgress } from "@/components/xp/level-progress";
import { StreakCalendar } from "@/components/streak/streak-calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { getStreak } from "@/lib/streak";
import { getLevel } from "@/lib/level";
import { useLeaderboard } from "@/hooks/use-leaderboard";
import { getMockAchievements } from "@/lib/achievements";
import Link from "next/link";

function EnrolledCourseCard({ course }: { course: { courseId: string; xpPerLesson: number; lessonCount: number; trackId: number } }) {
  const t = useTranslations("dashboard");
  // We don't have per-course enrollment data aggregated in useCourses,
  // but the card links to the course detail page where progress is shown
  const totalXp = course.xpPerLesson * course.lessonCount;

  return (
    <Link
      href={`/courses/${course.courseId}`}
      className="group flex items-center gap-4 rounded-xl border border-edge-soft bg-card p-4 transition-all hover:border-edge hover:bg-card-hover"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-solana-purple/10 text-lg font-bold text-solana-purple">
        {course.courseId.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold text-content group-hover:text-solana-purple transition-colors">
          {course.courseId}
        </p>
        <p className="text-xs text-content-muted">
          {course.lessonCount} {t("lessons")} · {totalXp} XP
        </p>
      </div>
      <div className="text-xs text-content-muted">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

export default function LearnerDashboard() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const { publicKey } = useWallet();
  const { data: xp, isLoading: xpLoading } = useXpBalance();
  const { data: courses } = useCourses();
  const { data: leaderboardEntries } = useLeaderboard();
  const [streak, setStreak] = useState(0);
  const achievements = getMockAchievements("en");

  useEffect(() => {
    setStreak(getStreak());
  }, []);

  if (!publicKey) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card border border-edge-soft">
          <svg className="h-8 w-8 text-content-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p className="text-sm text-content-muted">{tc("noWallet")}</p>
      </div>
    );
  }

  const level = getLevel(xp ?? 0);
  const activeCourses = courses ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-3xl font-bold text-content"
      >
        {t("title")}
      </motion.h1>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        <div className="rounded-xl border border-edge-soft bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-content-muted">{t("totalXp")}</p>
          {xpLoading ? (
            <Skeleton className="mt-1 h-8 w-20" />
          ) : (
            <p className="mt-1 font-mono text-2xl font-black text-content">{(xp ?? 0).toLocaleString()}</p>
          )}
        </div>
        <div className="rounded-xl border border-edge-soft bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-content-muted">{t("level")}</p>
          <p className="mt-1 font-mono text-2xl font-black text-solana-purple">{level}</p>
        </div>
        <div className="rounded-xl border border-edge-soft bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-content-muted">{t("streakLabel")}</p>
          <p className="mt-1 font-mono text-2xl font-black text-orange-400">{streak}</p>
        </div>
        <div className="rounded-xl border border-edge-soft bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-content-muted">{t("coursesAvailable")}</p>
          <p className="mt-1 font-mono text-2xl font-black text-content">{activeCourses.length}</p>
        </div>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Left column: XP + Courses */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6 lg:col-span-3"
        >
          {/* XP & Level */}
          <div className="rounded-2xl border border-edge-soft bg-card p-6">
            {xpLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-14 w-48" />
                <Skeleton className="h-2 w-full" />
              </div>
            ) : (
              <div className="space-y-6">
                <XpDisplay xp={xp ?? 0} />
                <LevelProgress xp={xp ?? 0} />
              </div>
            )}
          </div>

          {/* Available courses */}
          <div>
            <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-content-muted">
              {t("availableCourses")}
            </h2>
            {activeCourses.length === 0 ? (
              <div className="rounded-xl border border-edge-soft bg-card p-8 text-center">
                <p className="text-sm text-content-muted">{t("noCoursesYet")}</p>
                <Link href="/" className="mt-2 inline-block text-sm font-medium text-solana-purple hover:underline">
                  {t("browseCourses")}
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {activeCourses.map((course) => (
                  <EnrolledCourseCard key={course.courseId} course={course} />
                ))}
              </div>
            )}
          </div>

          {/* Recommended */}
          <div>
            <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-content-muted">
              {t("recommended")}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {activeCourses.slice(0, 2).map((course) => (
                <Link
                  key={`rec-${course.courseId}`}
                  href={`/courses/${course.courseId}`}
                  className="rounded-xl border border-solana-purple/20 bg-solana-purple/[0.03] p-4 transition-colors hover:border-solana-purple/40"
                >
                  <p className="text-xs font-semibold text-solana-purple">{t("recommendedBadge")}</p>
                  <p className="mt-1 text-sm font-medium text-content">{course.courseId}</p>
                  <p className="mt-0.5 text-xs text-content-muted">
                    {course.lessonCount} {t("lessons")} · {course.xpPerLesson * course.lessonCount} XP
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right column: Rank, Streak, Achievements, Activity */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-6 lg:col-span-2"
        >
          {/* Rank */}
          {(() => {
            const myWallet = publicKey?.toBase58();
            const myRank = leaderboardEntries?.find((e) => e.wallet === myWallet)?.rank;
            return (
              <div className="rounded-2xl border border-edge-soft bg-card p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-content-muted">{t("rank")}</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-black text-solana-cyan">
                    {myRank ? `#${myRank}` : "—"}
                  </span>
                  <Link href="/leaderboard" className="text-xs text-solana-purple hover:underline">
                    {tc("leaderboard")}
                  </Link>
                </div>
              </div>
            );
          })()}

          <StreakCalendar />

          {/* Recent Achievements */}
          <div className="rounded-2xl border border-edge-soft bg-card p-4">
            <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-content-muted">
              {t("recentAchievements")}
            </h3>
            <div className="space-y-2">
              {achievements.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  className={`flex items-center gap-3 rounded-lg p-2 ${a.unlocked ? "bg-card-hover" : "opacity-40"}`}
                >
                  <span className="text-lg">{a.icon}</span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-content">{a.name.en}</p>
                    <p className="truncate text-[10px] text-content-muted">{a.description.en}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/profile" className="mt-3 block text-xs text-solana-purple hover:underline">
              {t("viewAll")}
            </Link>
          </div>

          {/* Activity Feed */}
          <div className="rounded-2xl border border-edge-soft bg-card p-4">
            <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-content-muted">
              {t("activityFeed")}
            </h3>
            <p className="text-xs text-content-muted">{t("noActivity")}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
