"use client";

import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { Zap, Flame, BookOpen, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { XpDisplay } from "@/components/gamification/xp-display";
import { StreakCalendar } from "@/components/gamification/streak-calendar";
import { LevelBadge } from "@/components/gamification/level-badge";
import { CourseCard } from "@/components/course/course-card";
import { ConnectPrompt } from "@/components/auth/connect-prompt";
import { useXpBalance, useLevel } from "@/hooks/use-xp";
import { useUserEnrollments } from "@/hooks/use-enrollment";
import { useStreak } from "@/hooks/use-streak";
import { useCourses } from "@/hooks/use-courses";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { connected } = useWallet();
  const { data: xp, isLoading: xpLoading } = useXpBalance();
  const { level } = useLevel();
  const { data: enrollments } = useUserEnrollments();
  const { data: streak } = useStreak();
  const { data: courses } = useCourses();

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-16">
        <ConnectPrompt message={t("connectToViewDashboard")} />
      </div>
    );
  }

  const currentXp = xp ?? 0;
  const currentLevel = level ?? 0;
  const currentStreak = streak?.current_streak ?? 0;
  const longestStreak = streak?.longest_streak ?? 0;
  const enrolledCount = enrollments?.length ?? 0;
  const completedCount = enrollments?.filter((e) => e.completedAt).length ?? 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-superteam-green/10">
              <Zap className="h-5 w-5 text-superteam-green" />
            </div>
            <div>
              {xpLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <div className="text-2xl font-bold">{currentXp.toLocaleString()}</div>
              )}
              <div className="text-xs text-muted-foreground">{t("totalXp")}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <LevelBadge level={currentLevel} size="md" />
            <div>
              <div className="text-2xl font-bold">{currentLevel}</div>
              <div className="text-xs text-muted-foreground">{t("level")}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-superteam-orange/10">
              <Flame className="h-5 w-5 text-superteam-orange" />
            </div>
            <div>
              <div className="text-2xl font-bold">{currentStreak}</div>
              <div className="text-xs text-muted-foreground">{t("dayStreak")}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-superteam-purple/10">
              <Trophy className="h-5 w-5 text-superteam-purple" />
            </div>
            <div>
              <div className="text-2xl font-bold">{completedCount}</div>
              <div className="text-xs text-muted-foreground">{t("coursesCompleted")}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* XP Progress */}
      <Card>
        <CardContent className="p-6">
          <XpDisplay xp={currentXp} />
        </CardContent>
      </Card>

      {/* Streak Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("activityStreak")}</CardTitle>
        </CardHeader>
        <CardContent>
          <StreakCalendar
            currentStreak={currentStreak}
            longestStreak={longestStreak}
          />
        </CardContent>
      </Card>

      {/* Active Courses */}
      <div>
        <h2 className="text-xl font-bold mb-4">
          {t("activeCourses")} ({enrolledCount})
        </h2>
        {enrolledCount === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p>{t("noActiveCourses")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses
              ?.filter((c) =>
                enrollments?.some(
                  (e) => !e.completedAt
                )
              )
              .slice(0, 6)
              .map((course) => (
                <CourseCard key={course.courseId} course={course} progress={50} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
