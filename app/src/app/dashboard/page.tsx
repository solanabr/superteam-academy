"use client";

import { AchievementCard } from "@/components/gamification/achievement-card";
import { LevelBadge } from "@/components/gamification/level-badge";
import { StreakCalendar } from "@/components/gamification/streak-calendar";
import { XpDisplay } from "@/components/gamification/xp-display";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useXp } from "@/hooks/use-xp";
import { useOnChainCourses } from "@/hooks/use-on-chain";
import { mockCourses } from "@/lib/data/mock-courses";
import { mockAchievements } from "@/lib/data/mock-courses";
import { useUserStore } from "@/lib/store/user-store";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { BookOpenCheck, Flame, Layers3, Sparkles, Trophy, Wallet } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { ComponentType } from "react";

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
  const profile = useUserStore((state) => state.profile);
  const walletAddress = useUserStore((state) => state.walletAddress);
  const enrollments = useUserStore((state) => state.enrollments);
  const completedLessons = useUserStore((state) => state.completedLessons);
  const xp = useXp(walletAddress, profile.id);
  const wallet = useWallet();
  const { data: onChainCourses } = useOnChainCourses();

  const enrolledCourses = useMemo(
    () => mockCourses.filter((course) => enrollments.includes(course.id)),
    [enrollments],
  );

  const onChainEnrolledCount = useMemo(() => {
    if (!onChainCourses) return enrolledCourses.length;
    return onChainCourses.filter((c) =>
      enrollments.includes(c.courseId),
    ).length || enrolledCourses.length;
  }, [onChainCourses, enrollments, enrolledCourses.length]);

  if (!wallet.connected) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
        <div className="rounded-2xl border border-border bg-card p-8">
          <Wallet className="mx-auto mb-4 size-12 text-muted-foreground" />
          <h1 className="text-2xl font-semibold text-foreground">Connect your wallet</h1>
          <p className="mt-2 max-w-md text-muted-foreground">
            Connect your Solana wallet to access your dashboard, track progress, and earn XP.
          </p>
          <div className="mt-6">
            <WalletMultiButton className="rounded-lg! bg-gradient-cta! px-6! py-2! text-cta-foreground!" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/courses" className="text-st-yellow hover:underline">Browse courses</Link>
          {" "}to get started.
        </p>
      </div>
    );
  }

  const activityFeed = (() => {
    const activities: string[] = [];
    for (const courseId of enrollments) {
      const course = mockCourses.find((c) => c.id === courseId);
      if (course) {
        activities.push(`Enrolled in ${course.title}`);
      }
      const lessons = completedLessons[courseId] ?? [];
      for (const lessonId of lessons.slice(-3)) {
        const lesson = course?.modules
          .flatMap((m) => m.lessons)
          .find((l) => l.id === lessonId);
        if (lesson) {
          activities.push(`Completed lesson: ${lesson.title}`);
        }
      }
    }
    if (activities.length === 0) {
      activities.push("No activity yet — enroll in a course to get started!");
    }
    return activities.slice(0, 8);
  })();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Welcome back, {profile.displayName}</h1>
            <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
          </div>
          <Avatar className="size-12 border border-border">
            <AvatarImage src={profile.avatar} alt={profile.displayName} />
            <AvatarFallback>{profile.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total XP" value={xp.totalXp.toLocaleString()} icon={Sparkles} accent="text-highlight" />
        <StatCard title="Current Level" value={`Lv ${xp.level}`} icon={Trophy} accent="text-warning" />
        <StatCard title="Current Streak" value={`${xp.streak?.currentStreak ?? 0} days`} icon={Flame} accent="text-warning" />
        <StatCard title="Courses Enrolled" value={onChainEnrolledCount.toString()} icon={BookOpenCheck} accent="text-info" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <article className="space-y-4 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Enrolled courses</h2>
            <Layers3 className="size-4 text-muted-foreground/70" />
          </div>
          {enrolledCourses.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No courses yet.{" "}
              <Link href="/courses" className="text-st-yellow hover:underline">Browse courses</Link>
            </p>
          ) : (
            <div className="space-y-3">
              {enrolledCourses.map((course) => {
                const completed = completedLessons[course.id]?.length ?? 0;
                const total = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
                const ratio = total === 0 ? 0 : Math.round((completed / total) * 100);
                return (
                  <Link key={course.id} href={`/courses/${course.slug}`} className="block">
                    <div className="rounded-lg border border-border bg-surface p-3 transition hover:border-highlight/30">
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <p className="font-medium text-foreground">{course.title}</p>
                        <span className="text-xs text-muted-foreground">
                          {completed}/{total} lessons
                        </span>
                      </div>
                      <Progress value={ratio} className="h-2 bg-secondary" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </article>

        <article className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent activity</h2>
          <ul className="mt-3 space-y-2">
            {activityFeed.map((entry, i) => (
              <li key={i} className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-muted-foreground">
                {entry}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <article className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Quick actions</h2>
          <Button asChild className="w-full justify-start bg-highlight text-highlight-foreground">
            <Link href="/courses">Continue learning</Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start border-border bg-transparent text-foreground/90">
            <Link href="/leaderboard">View leaderboard</Link>
          </Button>
        </article>

        <article className="space-y-3 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Achievements</h2>
            <LevelBadge level={xp.level} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {mockAchievements.slice(0, 4).map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
          <XpDisplay xp={xp.totalXp} onChainXp={xp.onChainXp} />
        </article>
      </section>

      <StreakCalendar streak={xp.streak} />
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-muted-foreground/70">{title}</p>
        <Icon className={`size-4 ${accent}`} />
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </article>
  );
}
