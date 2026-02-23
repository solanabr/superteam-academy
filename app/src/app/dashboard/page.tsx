"use client";

import { AchievementCard } from "@/components/gamification/achievement-card";
import { LevelBadge } from "@/components/gamification/level-badge";
import { StreakCalendar } from "@/components/gamification/streak-calendar";
import { XpDisplay } from "@/components/gamification/xp-display";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useXp } from "@/hooks/use-xp";
import { mockCourses } from "@/lib/data/mock-courses";
import { achievementService } from "@/lib/services/achievement-service";
import { useUserStore } from "@/lib/store/user-store";
import type { Achievement } from "@/types";
import { BookOpenCheck, Flame, Layers3, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
  const profile = useUserStore((state) => state.profile);
  const walletAddress = useUserStore((state) => state.walletAddress);
  const enrollments = useUserStore((state) => state.enrollments);
  const completedLessons = useUserStore((state) => state.completedLessons);
  const xp = useXp(walletAddress, profile.id);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    achievementService.listAchievements(profile.id).then(setAchievements);
  }, [profile.id]);

  const enrolledCourses = useMemo(
    () => mockCourses.filter((course) => enrollments.includes(course.id)),
    [enrollments],
  );

  const activityFeed = useMemo(
    () => [
      "Completed lesson: Decode Account Data",
      "Earned achievement: Anchor Sprint",
      "Reached a 6-day learning streak",
      "Submitted challenge: Transfer Hook Validator",
      "Enrolled in Security Auditing",
      "Minted credential: Solana Fundamentals",
    ],
    [],
  );

  const weeklyXp = useMemo(
    () => [60, 95, 40, 85, 120, 75, 110],
    [],
  );

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/75 p-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(153,69,255,0.25),transparent_40%),radial-gradient(circle_at_90%_30%,rgba(20,241,149,0.2),transparent_35%)]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">Welcome back, {profile.displayName}</h1>
            <p className="mt-2 text-zinc-300">{t("subtitle")}</p>
          </div>
          <Avatar className="size-14 border border-white/15">
            <AvatarImage src={profile.avatar} alt={profile.displayName} />
            <AvatarFallback>{profile.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total XP" value={xp.totalXp.toLocaleString()} icon={Sparkles} accent="text-[#14F195]" />
        <StatCard title="Current Level" value={`Lv ${xp.level}`} icon={Trophy} accent="text-amber-300" />
        <StatCard title="Current Streak" value={`${xp.streak?.currentStreak ?? 0} days`} icon={Flame} accent="text-orange-300" />
        <StatCard title="Courses Enrolled" value={enrolledCourses.length.toString()} icon={BookOpenCheck} accent="text-[#8f9bff]" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <article className="space-y-4 rounded-xl border border-white/10 bg-zinc-900/70 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Enrolled courses</h2>
            <Layers3 className="size-4 text-zinc-500" />
          </div>
          <div className="space-y-3">
            {enrolledCourses.map((course) => {
              const completed = completedLessons[course.id]?.length ?? 0;
              const total = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
              const ratio = total === 0 ? 0 : Math.round((completed / total) * 100);
              return (
                <div key={course.id} className="rounded-lg border border-white/10 bg-zinc-950/60 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <p className="font-medium text-zinc-100">{course.title}</p>
                    <span className="text-xs text-zinc-400">
                      {completed}/{total} lessons
                    </span>
                  </div>
                  <Progress value={ratio} className="h-2 bg-zinc-800" />
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-xl border border-white/10 bg-zinc-900/70 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Recent activity</h2>
          <ul className="mt-3 space-y-2">
            {activityFeed.map((entry) => (
              <li key={entry} className="rounded-md border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-300">
                {entry}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <article className="rounded-xl border border-white/10 bg-zinc-900/70 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Weekly XP</h2>
          <div className="mt-4 grid grid-cols-7 gap-2">
            {weeklyXp.map((value, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <div className="flex h-36 w-full items-end rounded-md bg-zinc-950/80 p-1">
                  <div
                    className="w-full rounded-sm bg-gradient-to-t from-[#9945FF] to-[#14F195]"
                    style={{ height: `${Math.max(10, Math.min(100, Math.round((value / 130) * 100)))}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-500">D{index + 1}</span>
              </div>
            ))}
          </div>
        </article>
        <StreakCalendar streak={xp.streak} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <article className="space-y-3 rounded-xl border border-white/10 bg-zinc-900/70 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Quick actions</h2>
          <Button asChild className="w-full justify-start bg-gradient-to-r from-[#9945FF] to-[#14F195] text-black">
            <Link href="/courses">Continue learning</Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start border-white/20 bg-transparent text-zinc-200">
            <Link href="/courses">Browse courses</Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start border-white/20 bg-transparent text-zinc-200">
            <Link href="/leaderboard">View leaderboard</Link>
          </Button>
        </article>

        <article className="space-y-3 rounded-xl border border-white/10 bg-zinc-900/70 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Achievements</h2>
            <LevelBadge level={xp.level} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {achievements.slice(0, 4).map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
          <XpDisplay xp={xp.totalXp} onChainXp={xp.onChainXp} />
        </article>
      </section>
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
    <article className="rounded-xl border border-white/10 bg-zinc-900/70 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-zinc-500">{title}</p>
        <Icon className={`size-4 ${accent}`} />
      </div>
      <p className="mt-2 text-2xl font-semibold text-zinc-100">{value}</p>
    </article>
  );
}
