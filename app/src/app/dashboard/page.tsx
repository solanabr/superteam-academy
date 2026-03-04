"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useLocale } from "@/contexts/locale-context";
import { useLearning } from "@/contexts/learning-context";
import { COURSES } from "@/services/course-data";
import {
  calculateLevel,
  xpForLevel,
  xpProgressInLevel,
} from "@/config/constants";
import { CourseCard } from "@/components/course-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Trophy,
  Flame,
  BookOpen,
  Award,
  ArrowRight,
  Calendar,
} from "lucide-react";

export default function DashboardPage() {
  const { t } = useLocale();
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { xp, progress, streak, credentials } = useLearning();

  if (!connected) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Zap className="h-12 w-12 text-violet-500" />
        <h2 className="text-2xl font-bold">{t("dashboard.title")}</h2>
        <p className="text-muted-foreground">{t("wallet.connect")}</p>
        <Button
          onClick={() => setVisible(true)}
          className="bg-gradient-to-r from-violet-600 to-fuchsia-600"
        >
          {t("nav.connectWallet")}
        </Button>
      </div>
    );
  }

  const level = calculateLevel(xp);
  const nextLevel = level + 1;
  const xpNeeded = xpForLevel(nextLevel) - xp;
  const levelProgress = xpProgressInLevel(xp);

  const enrolledCourses = COURSES.filter((c) => progress.has(c.id));
  const completedCount = Array.from(progress.values()).filter(
    (p) => p.completedAt !== null
  ).length;
  const lessonsCompleted = Array.from(progress.values()).reduce(
    (sum, p) => sum + p.completedLessons.length,
    0
  );

  const recommendedCourses = COURSES.filter(
    (c) => c.isActive && !progress.has(c.id)
  ).slice(0, 3);

  // Generate calendar data for last 12 weeks
  const calendarWeeks: Array<Array<{ date: string; active: boolean }>> = [];
  const today = new Date();
  for (let w = 11; w >= 0; w--) {
    const week: Array<{ date: string; active: boolean }> = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - w * 7 - (6 - d));
      const dateStr = date.toISOString().split("T")[0];
      week.push({
        date: dateStr,
        active: !!streak.activityCalendar[dateStr],
      });
    }
    calendarWeeks.push(week);
  }

  return (
    <div className="animate-fade-in">
      <div className="border-b border-border/40 bg-gradient-to-b from-violet-500/5 to-transparent">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">
            {t("dashboard.welcome")},{" "}
            <span className="gradient-text">
              {publicKey?.toBase58().slice(0, 8)}...
            </span>
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* XP Card */}
          <Card className="border-border/40">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <Zap className="h-8 w-8 text-violet-500" />
                <Badge className="bg-violet-500/10 text-violet-500 border-violet-500/20">
                  {t("dashboard.level", { level })}
                </Badge>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold">{xp.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">
                  {t("dashboard.xpBalance")}
                </div>
              </div>
              <div className="mt-3">
                <Progress value={levelProgress} className="h-1.5" />
                <div className="mt-1 text-xs text-muted-foreground">
                  {t("dashboard.xpToNextLevel", {
                    amount: xpNeeded,
                    level: nextLevel,
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Streak Card */}
          <Card className="border-border/40">
            <CardContent className="p-6">
              <Flame className="h-8 w-8 text-orange-500" />
              <div className="mt-3">
                <div className="text-2xl font-bold">
                  {streak.currentStreak}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t("dashboard.streak")}
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {t("dashboard.longestStreak")}:{" "}
                {t("dashboard.streakDays", { days: streak.longestStreak })}
              </div>
            </CardContent>
          </Card>

          {/* Courses Completed */}
          <Card className="border-border/40">
            <CardContent className="p-6">
              <Trophy className="h-8 w-8 text-amber-500" />
              <div className="mt-3">
                <div className="text-2xl font-bold">{completedCount}</div>
                <div className="text-sm text-muted-foreground">
                  {t("dashboard.coursesCompleted")}
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {lessonsCompleted} {t("dashboard.lessonsCompleted").toLowerCase()}
              </div>
            </CardContent>
          </Card>

          {/* Credentials */}
          <Card className="border-border/40">
            <CardContent className="p-6">
              <Award className="h-8 w-8 text-fuchsia-500" />
              <div className="mt-3">
                <div className="text-2xl font-bold">{credentials.length}</div>
                <div className="text-sm text-muted-foreground">
                  {t("dashboard.credentials")}
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                On-chain NFTs
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Calendar */}
        <Card className="mb-8 border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-violet-500" />
              <h2 className="text-lg font-semibold">
                {t("dashboard.activityCalendar")}
              </h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1 overflow-x-auto pb-2">
              {calendarWeeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {week.map((day) => (
                    <div
                      key={day.date}
                      className={`h-3 w-3 rounded-sm ${
                        day.active
                          ? "bg-violet-500"
                          : "bg-muted"
                      }`}
                      title={day.date}
                    />
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current Courses */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {t("dashboard.currentCourses")}
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/courses">
                {t("common.viewAll")}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {enrolledCourses.length === 0 ? (
            <Card className="border-border/40">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-4 text-muted-foreground">
                  {t("dashboard.noCoursesYet")}
                </p>
                <Button asChild>
                  <Link href="/courses">{t("dashboard.startLearning")}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {enrolledCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>

        {/* Credentials Display */}
        {credentials.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">
              {t("profile.credentials")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {credentials.map((cred) => (
                <Card key={cred.assetId} className="border-border/40">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
                        <Award className="h-6 w-6 text-violet-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{cred.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {cred.coursesCompleted} courses &middot; {cred.totalXp} XP
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Courses */}
        {recommendedCourses.length > 0 && (
          <div>
            <h2 className="mb-4 text-xl font-semibold">
              {t("dashboard.recommended")}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recommendedCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
