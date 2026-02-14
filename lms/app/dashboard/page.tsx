"use client";

import Link from "next/link";
import { Flame, Zap, Trophy, BookOpen, ArrowRight, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useXP, useLevel, useStreak, useAllProgress, useCourses, useAchievements } from "@/lib/hooks/use-service";
import { getXpProgress, formatXP } from "@/lib/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { connected } = useWallet();
  const { data: xp = 0, isLoading: xpLoading } = useXP();
  const { data: level = 0 } = useLevel();
  const { data: streak } = useStreak();
  const { data: allProgress } = useAllProgress();
  const { data: courses } = useCourses();
  const { data: achievements } = useAchievements();

  const xpProgress = getXpProgress(xp);
  const inProgressCourses = allProgress?.filter((p) => !p.completedAt) ?? [];
  const completedCount = allProgress?.filter((p) => p.completedAt).length ?? 0;
  const claimedAchievements = achievements?.filter((a) => a.claimed).length ?? 0;

  if (!connected) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-4 text-muted-foreground">Connect your wallet to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total XP</p>
                {xpLoading ? <Skeleton className="h-8 w-20 mt-1" /> : (
                  <p className="text-2xl font-bold text-xp-gold">{formatXP(xp)}</p>
                )}
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-xp-gold/10">
                <Zap className="h-6 w-6 text-xp-gold" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Level {level}</span>
                <span>Level {level + 1}</span>
              </div>
              <Progress value={xpProgress.percent} indicatorClassName="bg-xp-gold" />
              <p className="text-xs text-muted-foreground mt-1">{xpProgress.current}/{xpProgress.needed} XP to next level</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold text-streak-orange">{streak?.current ?? 0} days</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-streak-orange/10">
                <Flame className="h-6 w-6 text-streak-orange" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Longest: {streak?.longest ?? 0} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Courses Completed</p>
                <p className="text-2xl font-bold">{completedCount}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-solana-green/10">
                <BookOpen className="h-6 w-6 text-solana-green" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Achievements</p>
                <p className="text-2xl font-bold">{claimedAchievements}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-solana-purple/10">
                <Trophy className="h-6 w-6 text-solana-purple" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Current Courses */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Current Courses</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/courses">Browse Courses <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          {inProgressCourses.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 font-medium">No courses in progress</p>
                <p className="mt-2 text-sm text-muted-foreground">Start learning by enrolling in a course.</p>
                <Button asChild className="mt-4"><Link href="/courses">Browse Courses</Link></Button>
              </CardContent>
            </Card>
          ) : (
            inProgressCourses.map((p) => {
              const course = courses?.find((c) => c.id === p.courseId || c.slug === p.courseId);
              if (!course) return null;
              return (
                <Card key={p.courseId}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Link href={`/courses/${course.slug}`} className="font-medium hover:text-solana-purple transition-colors">
                          {course.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={course.difficulty as "beginner" | "intermediate" | "advanced"} className="text-[10px]">
                            {course.difficulty}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {p.lessonsCompleted.length}/{p.totalLessons} lessons
                          </span>
                        </div>
                      </div>
                      <Button asChild size="sm">
                        <Link href={`/courses/${course.slug}`}>Continue</Link>
                      </Button>
                    </div>
                    <Progress value={p.percentComplete} className="mt-3" indicatorClassName="bg-solana-green" />
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Streak Calendar */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Streak Calendar</h2>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5" /> Last 30 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {(streak?.history ?? Array.from({ length: 30 }, (_, i) => ({
                  date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split("T")[0],
                  active: false,
                  frozen: false,
                }))).map((day) => (
                  <div
                    key={day.date}
                    className={cn(
                      "h-6 w-6 rounded-sm text-[9px] flex items-center justify-center",
                      day.active ? "bg-solana-green text-black font-bold" :
                      day.frozen ? "bg-solana-cyan/30 text-solana-cyan" :
                      "bg-muted text-muted-foreground"
                    )}
                    title={day.date}
                  >
                    {new Date(day.date).getDate()}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-sm bg-solana-green" /> Active
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-sm bg-solana-cyan/30" /> Frozen
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-sm bg-muted" /> Missed
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <h2 className="text-xl font-semibold">Recent Achievements</h2>
          <Card>
            <CardContent className="p-4 space-y-3">
              {(achievements ?? []).filter((a) => a.claimed).slice(0, 5).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No achievements yet</p>
              ) : (
                achievements!.filter((a) => a.claimed).slice(0, 5).map((a) => (
                  <div key={a.id} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-solana-purple/10">
                      <Trophy className="h-4 w-4 text-solana-purple" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{a.name}</p>
                      <p className="text-xs text-muted-foreground">+{a.xpReward} XP</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
