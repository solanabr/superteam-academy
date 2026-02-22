"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  BookOpen,
  Flame,
  Zap,
  Trophy,
  Award,
  ArrowRight,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useXP,
  useLevel,
  useStreak,
  useAllProgress,
  useCourses,
  useAchievements,
  useClaimAchievement,
  usePracticeProgress,
} from "@/lib/hooks/use-service";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  checkAchievementEligibility,
  type AchievementContext,
} from "@/types/gamification";
import { toast } from "sonner";
import { useState } from "react";

function xpForLevel(level: number) {
  return level * level * 100;
}

export default function DashboardPage() {
  const { connected, publicKey } = useWallet();
  const { data: xp, isLoading: xpLoading } = useXP();
  const { data: level } = useLevel();
  const { data: streak, isLoading: streakLoading } = useStreak();
  const { data: allProgress, isLoading: progressLoading } = useAllProgress();
  const { data: courses } = useCourses();
  const { data: achievements } = useAchievements();
  const { completed: practiceCompleted } = usePracticeProgress();
  const claimAchievement = useClaimAchievement();
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const ta = useTranslations("achievements");

  if (!connected) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#008c4c]/20 to-[#ffd23f]/20 mb-6">
          <Zap className="h-10 w-10 text-solana-purple" />
        </div>
        <h1 className="text-3xl font-bold">{t("welcomeTitle")}</h1>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto">
          {t("welcomeDescription")}
        </p>
      </div>
    );
  }

  const currentXP = xp ?? 0;
  const currentLevel = level ?? 0;
  const nextLevelXP = xpForLevel(currentLevel + 1);
  const currentLevelXP = xpForLevel(currentLevel);
  const progressToNext =
    nextLevelXP > currentLevelXP
      ? ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
      : 0;

  const enrolledCourses = allProgress?.filter((p) => !p.completedAt) ?? [];
  const completedCourses = allProgress?.filter((p) => p.completedAt) ?? [];
  const claimedAchievements = achievements?.filter((a) => a.claimed) ?? [];
  const unclaimedAchievements =
    achievements?.filter((a) => !a.claimed).slice(0, 3) ?? [];

  const totalLessonsCompleted =
    allProgress?.reduce((sum, p) => sum + p.lessonsCompleted.length, 0) ?? 0;
  const completedTrackIds = completedCourses.reduce<number[]>((ids, p) => {
    const course = courses?.find((c) => c.id === p.courseId);
    if (course && !ids.includes(course.trackId)) ids.push(course.trackId);
    return ids;
  }, []);
  const hasSpeedRun = completedCourses.some((p) => {
    if (!p.completedAt || !p.enrolledAt) return false;
    return (
      new Date(p.completedAt).toDateString() ===
      new Date(p.enrolledAt).toDateString()
    );
  });
  const achievementCtx: AchievementContext = {
    lessonsCompleted: totalLessonsCompleted,
    coursesCompleted: completedCourses.length,
    longestStreak: streak?.longest ?? 0,
    practiceCount: practiceCompleted.length,
    completedTrackIds,
    hasSpeedRun,
    referralCount: 0,
  };

  const getCourse = (courseId: string) =>
    courses?.find((c) => c.id === courseId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground font-mono">
          {publicKey?.toBase58().slice(0, 4)}...
          {publicKey?.toBase58().slice(-4)}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("totalXP")}</p>
                {xpLoading ? (
                  <Skeleton className="h-8 w-20 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-xp-gold">
                    {currentXP.toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-xp-gold/10">
                <Zap className="h-5 w-5 text-xp-gold" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("level")}</p>
                <p className="text-2xl font-bold">{currentLevel}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-solana-purple/10">
                <Star className="h-5 w-5 text-solana-purple" />
              </div>
            </div>
            <Progress
              value={progressToNext}
              className="mt-2 h-1.5"
              indicatorClassName="bg-solana-purple"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t("xpToLevel", {
                current: currentXP - currentLevelXP,
                needed: nextLevelXP - currentLevelXP,
                level: currentLevel + 1,
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("streak")}</p>
                {streakLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-streak-orange">
                    {t("days", { count: streak?.current ?? 0 })}
                  </p>
                )}
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-streak-orange/10">
                <Flame className="h-5 w-5 text-streak-orange" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("longest", { count: streak?.longest ?? 0 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("achievements")}
                </p>
                <p className="text-2xl font-bold">
                  {claimedAchievements.length}/{achievements?.length ?? 0}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-solana-green/10">
                <Award className="h-5 w-5 text-solana-green" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Streak Calendar */}
      <Card className="mb-8 min-h-[140px]">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="h-5 w-5 text-streak-orange" />{" "}
            {t("streakCalendar")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {streak ? (
            <>
              <div className="flex gap-1.5 flex-wrap">
                {streak.history.map((day, i) => (
                  <div
                    key={i}
                    className={`h-6 w-6 rounded-sm transition-colors ${
                      day.active
                        ? "bg-solana-green"
                        : day.frozen
                          ? "bg-blue-400"
                          : "bg-muted"
                    }`}
                    title={`${day.date}${day.active ? ` - ${t("active")}` : day.frozen ? ` - ${t("frozen")}` : ""}`}
                  />
                ))}
              </div>
              <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-solana-green" />{" "}
                  {t("active")}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-blue-400" />{" "}
                  {t("frozen")}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-muted" />{" "}
                  {t("inactive")}
                </span>
              </div>
            </>
          ) : (
            <div className="flex gap-1.5 flex-wrap">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="h-6 w-6 rounded-sm bg-muted" />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Current Courses */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> {t("currentCourses")}
          </h2>
          {progressLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : enrolledCourses.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">{t("noCourses")}</p>
                <Button asChild className="mt-4" variant="solana">
                  <Link href="/courses">{t("browseCourses")}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {enrolledCourses.map((progress) => {
                const course = getCourse(progress.courseId);
                if (!course) return null;
                return (
                  <Card
                    key={progress.courseId}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <Link
                            href={`/courses/${course.slug}`}
                            className="font-semibold hover:text-solana-purple transition-colors"
                          >
                            {course.title}
                          </Link>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {progress.lessonsCompleted.length}/
                            {progress.totalLessons} lessons
                          </p>
                        </div>
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/courses/${course.slug}`}>
                            {tc("continue")}{" "}
                            <ArrowRight className="h-3.5 w-3.5 ml-1" />
                          </Link>
                        </Button>
                      </div>
                      <Progress
                        value={progress.percentComplete}
                        indicatorClassName="bg-solana-green"
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {completedCourses.length > 0 && (
            <>
              <h2 className="text-xl font-semibold mt-8 mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-xp-gold" />{" "}
                {t("completedCourses")}
              </h2>
              <div className="space-y-2">
                {completedCourses.map((p) => {
                  const course = getCourse(p.courseId);
                  if (!course) return null;
                  return (
                    <Card key={p.courseId}>
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-solana-green/10 flex items-center justify-center">
                            <Trophy className="h-4 w-4 text-solana-green" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {course.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t("xpEarned", { amount: course.xpTotal })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/certificates/${course.trackId}`}>
                              {t("certificate")}
                            </Link>
                          </Button>
                          <Badge className="bg-solana-green/10 text-solana-green border-0">
                            {tc("completed")}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5" /> {t("nextAchievements")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {unclaimedAchievements.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("allAchievementsUnlocked")}
                </p>
              ) : (
                unclaimedAchievements.map((a) => {
                  const eligible = checkAchievementEligibility(
                    a.id,
                    achievementCtx,
                  );
                  return (
                    <div key={a.id} className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                          eligible ? "bg-xp-gold/10 text-xp-gold" : "bg-muted"
                        }`}
                      >
                        {a.id + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {eligible ? ta("eligible") : a.requirement}
                        </p>
                      </div>
                      {eligible ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2 border-xp-gold/50 text-xp-gold hover:bg-xp-gold/10 shrink-0"
                          disabled={claimingId !== null}
                          onClick={() => {
                            setClaimingId(a.id);
                            claimAchievement.mutate(a.id, {
                              onSuccess: () =>
                                toast.success(
                                  ta("claimSuccess", { amount: a.xpReward }),
                                ),
                              onSettled: () => setClaimingId(null),
                            });
                          }}
                        >
                          {claimingId === a.id ? ta("claiming") : ta("claim")}
                        </Button>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs text-xp-gold shrink-0"
                        >
                          +{a.xpReward}
                        </Badge>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t("recommended")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {courses
                ?.filter((c) => !allProgress?.some((p) => p.courseId === c.id))
                .slice(0, 3)
                .map((course) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.slug}`}
                    className="flex items-center gap-3 group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-solana-purple/10 flex items-center justify-center shrink-0">
                      <BookOpen className="h-4 w-4 text-solana-purple" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium group-hover:text-solana-purple transition-colors truncate">
                        {course.title}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {course.difficulty} · {course.xpTotal} XP
                      </p>
                    </div>
                  </Link>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
