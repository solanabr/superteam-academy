"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { COURSE_CARDS } from "@/lib/mock-data";
import {
  Star,
  Flame,
  Trophy,
  BookOpen,
  Target,
  ChevronRight,
  Zap,
  Calendar,
  Award,
} from "lucide-react";

const MOCK_STATS = {
  totalXP: 3420,
  level: 5,
  rank: 42,
  currentStreak: 12,
  coursesCompleted: 1,
  lessonsCompleted: 18,
};

const MOCK_ACTIVITY = [
  {
    type: "lesson",
    description: "Completed 'Understanding Accounts'",
    xp: 25,
    time: "2h ago",
  },
  {
    type: "challenge",
    description: "Passed 'Counter Challenge'",
    xp: 75,
    time: "3h ago",
  },
  {
    type: "streak",
    description: "12-day streak maintained",
    xp: 10,
    time: "Today",
  },
  {
    type: "lesson",
    description: "Completed 'Hello World Program'",
    xp: 30,
    time: "Yesterday",
  },
  {
    type: "achievement",
    description: "Unlocked 'Week Warrior'",
    xp: 100,
    time: "5d ago",
  },
];

const MOCK_ENROLLED = COURSE_CARDS.slice(0, 2).map((c, i) => ({
  ...c,
  progress: i === 0 ? 60 : 20,
}));

const ACHIEVEMENTS = [
  { name: "First Steps", icon: "footprints", unlocked: true },
  { name: "Week Warrior", icon: "flame", unlocked: true },
  { name: "Course Completer", icon: "graduation-cap", unlocked: false },
  { name: "Speed Runner", icon: "zap", unlocked: false },
  { name: "Rust Rookie", icon: "code", unlocked: false },
  { name: "Early Adopter", icon: "star", unlocked: true },
];

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");

  const streakDays = Array.from({ length: 28 }, (_, i) => {
    const active = i >= 16 && i < 16 + MOCK_STATS.currentStreak;
    return { day: i + 1, active };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("welcome")}!</p>
      </div>

      {/* Stats Row */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {MOCK_STATS.totalXP.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">{t("totalXP")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold/10">
              <Zap className="h-6 w-6 text-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {tc("level")} {MOCK_STATS.level}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("rank")} #{MOCK_STATS.rank}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10">
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{MOCK_STATS.currentStreak}</p>
              <p className="text-xs text-muted-foreground">
                {tc("streak")} ({tc("days")})
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-brand/10">
              <Trophy className="h-6 w-6 text-green-brand" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {MOCK_STATS.coursesCompleted}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("coursesCompleted")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-8 lg:col-span-2">
          {/* Active Courses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{t("activeCourses")}</CardTitle>
              <Link href="/courses">
                <Button variant="ghost" size="sm" className="gap-1">
                  {tc("viewAll")}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {MOCK_ENROLLED.length === 0 ? (
                <div className="py-8 text-center">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/30" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    {t("noCourses")}
                  </p>
                  <Link href="/courses">
                    <Button variant="outline" className="mt-4">
                      {t("exploreCourses")}
                    </Button>
                  </Link>
                </div>
              ) : (
                MOCK_ENROLLED.map((course) => (
                  <Link key={course.id} href={`/courses/${course.slug}`}>
                    <div className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-accent">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{course.title}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <Progress
                            value={course.progress}
                            className="h-1.5 flex-1"
                          />
                          <span className="text-xs text-muted-foreground">
                            {course.progress}%
                          </span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        {tc("continue")}
                      </Button>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* Streak Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                {t("streakCalendar")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1.5">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                  <div
                    key={i}
                    className="text-center text-xs text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
                {streakDays.map((day) => (
                  <div
                    key={day.day}
                    className={`aspect-square rounded-sm ${
                      day.active ? "bg-primary" : "bg-muted"
                    }`}
                    title={`Day ${day.day}`}
                  />
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">
                    {MOCK_STATS.currentStreak} {tc("days")}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Best: {MOCK_STATS.currentStreak + 3} {tc("days")}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-8">
          {/* Daily Challenge */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-gold/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{t("dailyChallenge")}</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                What is the maximum theoretical TPS of Solana?
              </p>
              <div className="mt-4 flex items-center justify-between">
                <Badge variant="secondary">Quiz</Badge>
                <span className="text-sm font-medium text-primary">
                  50 {tc("xp")}
                </span>
              </div>
              <Button className="mt-4 w-full" size="sm">
                Start Challenge
              </Button>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5" />
                {t("achievements")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {ACHIEVEMENTS.map((ach) => (
                  <div
                    key={ach.name}
                    className={`flex flex-col items-center gap-1 rounded-lg p-3 text-center ${
                      ach.unlocked ? "bg-primary/10" : "bg-muted opacity-50"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        ach.unlocked
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted-foreground/20"
                      }`}
                    >
                      <Award className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-medium leading-tight">
                      {ach.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("recentActivity")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {MOCK_ACTIVITY.map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                    <Star className="h-3 w-3 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-primary">
                        +{activity.xp} {tc("xp")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {activity.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
