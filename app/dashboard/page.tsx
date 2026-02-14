"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Trophy, Flame, Zap, BookOpen, ArrowRight, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XPBar } from "@/components/gamification/XPBar";
import { StreakCalendar } from "@/components/gamification/StreakCalendar";
import { AchievementGrid } from "@/components/gamification/AchievementGrid";
import { levelProgress } from "@/lib/gamification/levels";
import { achievements } from "@/lib/gamification/achievements";
import { useI18n } from "@/lib/i18n/provider";
import type { CmsCourse } from "@/lib/cms/types";

const demoXP = 760;
const demoStreak = 10;
const demoCoursesCompleted = 1;
const unlockedIds = [0, 1, 2];

const courseProgress: Record<string, number> = {
  "solana-foundations": 75,
  "anchor-development": 30,
};

export default function DashboardPage(): JSX.Element {
  const { t } = useI18n();
  const progress = levelProgress(demoXP);
  const [currentCourses, setCurrentCourses] = useState<CmsCourse[]>([]);

  useEffect(() => {
    const run = async () => {
      const response = await fetch("/api/courses");
      const json = (await response.json()) as { courses: CmsCourse[] };
      setCurrentCourses(json.courses.slice(0, 2));
    };
    void run();
  }, []);

  const activeDays = Array.from({ length: demoStreak }).map((_, index) => {
    const d = new Date();
    d.setDate(d.getDate() - index);
    return d.toISOString().slice(0, 10);
  });

  const unlockedAchievements = achievements.filter((a) => unlockedIds.includes(a.id));

  const statCards = [
    {
      label: "Total XP",
      value: demoXP.toLocaleString(),
      icon: Zap,
      color: "text-solana-green",
      bg: "bg-solana-green/10",
    },
    {
      label: t("common.level"),
      value: progress.level.toString(),
      icon: TrendingUp,
      color: "text-solana-purple",
      bg: "bg-solana-purple/10",
    },
    {
      label: t("common.streak"),
      value: `${demoStreak}d`,
      icon: Flame,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
    },
    {
      label: "Completed",
      value: demoCoursesCompleted.toString(),
      icon: Trophy,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-10">
      {/* Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-solana-purple/20 text-xl font-bold text-solana-purple">
            YU
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-solana-purple/30 bg-solana-purple/10 px-4 py-1.5 text-sm font-medium text-solana-purple">
          {t("common.level")} {progress.level}
        </span>
      </section>

      {/* Stats row */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* XP progress + Streak row */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-solana-green" />
              XP Progress
            </CardTitle>
            <CardDescription>
              {demoXP - progress.currentLevelXP} / {progress.nextLevelXP - progress.currentLevelXP} XP to Level {progress.level + 1}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <XPBar value={progress.progressPercent} max={100} />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Level {progress.level} — {progress.currentLevelXP} XP</span>
              <span>Level {progress.level + 1} — {progress.nextLevelXP} XP</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flame className="h-5 w-5 text-orange-400" />
              {t("dashboard.streakCalendar")}
            </CardTitle>
            <CardDescription>
              {"\u{1F525}"} {demoStreak} day streak — keep it going!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StreakCalendar activeDays={activeDays} />
          </CardContent>
        </Card>
      </section>

      {/* Courses + Achievements row */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-solana-purple" />
                {t("dashboard.currentCourses")}
              </CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href="/courses">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentCourses.map((course) => {
              const pct = courseProgress[course.slug] ?? 0;
              const lessonCount = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
              const diffColor =
                course.difficulty === "beginner"
                  ? "bg-emerald-500/10 text-emerald-500"
                  : course.difficulty === "intermediate"
                    ? "bg-amber-500/10 text-amber-500"
                    : "bg-red-500/10 text-red-500";

              return (
                <div key={course.slug} className="rounded-lg border p-4 transition-colors hover:border-solana-purple/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${diffColor}`}>
                          {t(`common.${course.difficulty}`)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {lessonCount} {t("common.lessons").toLowerCase()}
                        </span>
                      </div>
                      <p className="font-medium">{course.title}</p>
                    </div>
                    <Button asChild size="sm" variant="outline" className="shrink-0">
                      <Link href={`/courses/${course.slug}`}>
                        {t("common.continue")}
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                  {/* Progress */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{t("courses.detail.progress")}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-solana-green transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {currentCourses.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">Loading courses...</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-amber-400" />
              {t("dashboard.achievements")}
            </CardTitle>
            <CardDescription>
              {unlockedAchievements.length}/{achievements.length} unlocked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AchievementGrid items={unlockedAchievements} allAchievements={achievements} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
