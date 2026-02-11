"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import {
  BookOpen,
  Trophy,
  Lightning,
  X,
  GraduationCap,
  WarningOctagon,
} from "@phosphor-icons/react";
import type { StreakData } from "@superteam-lms/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LevelBadge } from "@/components/gamification/level-badge";
import { StreakDisplay } from "@/components/gamification/streak-display";
import { ProgressBar } from "@/components/course/progress-bar";
import { CourseCard } from "@/components/course/course-card";
import { MintButton } from "@/components/certificates/mint-button";
import { WalletNameGenerator } from "@/components/profile/wallet-name-generator";
import { createClient } from "@/lib/supabase/client";
import { getProgressService } from "@/lib/services";
import type {
  CertificateMetadata,
  MintResult,
} from "@/lib/solana/mint-certificate";
import { calculateLevel } from "@/lib/gamification/xp";
import {
  getCoursesByIds,
  getRecommendedCourses,
  type RecommendedCourse,
} from "@/lib/sanity/queries";

// Default streak for unauthenticated or on error
const defaultStreak: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: "",
  streakHistory: {},
};

interface CurrentCourse {
  courseId: string;
  title: string;
  slug: string;
  completedLessons: number;
  totalLessons: number;
}

interface DashboardData {
  xp: number;
  level: number;
  streak: StreakData;
  achievementsCount: number;
  currentCourses: CurrentCourse[];
  recommendedCourses: RecommendedCourse[];
  recentActivity: {
    action: string;
    detail: string;
    xp: number;
    time: string;
  }[];
  username: string;
  userId: string;
  nameRerollsUsed: number;
  isLoading: boolean;
  fetchError: boolean;
}

function useDashboardData(): DashboardData {
  const [data, setData] = useState<DashboardData>({
    xp: 0,
    level: 0,
    streak: defaultStreak,
    achievementsCount: 0,
    currentCourses: [],
    recommendedCourses: [],
    recentActivity: [],
    username: "Builder",
    userId: "",
    nameRerollsUsed: -1,
    isLoading: true,
    fetchError: false,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const user = session?.user ?? null;

        if (!user) {
          setData((prev) => ({ ...prev, isLoading: false }));
          return;
        }

        // Fetch XP + streak via service layer (on-chain first, Supabase fallback)
        const service = getProgressService(supabase);
        const [totalXp, streakData] = await Promise.all([
          service.getXP(user.id),
          service.getStreak(user.id),
        ]);

        // Fetch profile — separate name_rerolls_used to avoid breaking the
        // whole query if the column hasn't been migrated yet
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();

        const { data: rerollData } = await supabase
          .from("profiles")
          .select("name_rerolls_used")
          .eq("id", user.id)
          .single();

        // Fetch achievements count
        const { count: achievementsCount } = await supabase
          .from("user_achievements")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);

        // Fetch recent XP transactions
        const { data: transactions } = await supabase
          .from("xp_transactions")
          .select("amount, reason, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        // Fetch activity dates for streak heatmap (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { data: activityRows } = await supabase
          .from("xp_transactions")
          .select("created_at")
          .eq("user_id", user.id)
          .gte("created_at", thirtyDaysAgo.toISOString());

        const streakHistory: Record<string, boolean> = {};
        for (const row of activityRows ?? []) {
          const dateStr = row.created_at.split("T")[0] as string;
          streakHistory[dateStr] = true;
        }

        // Fetch enrollments, progress, and existing certificates in parallel
        const [
          { data: enrollments },
          { data: progressRows },
          { data: certRows },
        ] = await Promise.all([
          supabase
            .from("enrollments")
            .select("course_id")
            .eq("user_id", user.id),
          supabase
            .from("user_progress")
            .select("course_id, lesson_id, completed")
            .eq("user_id", user.id)
            .eq("completed", true),
          supabase
            .from("certificates")
            .select("course_id")
            .eq("user_id", user.id),
        ]);

        // Courses with minted certificates should not appear in "Current Courses"
        const mintedCourseIds = new Set(
          (certRows ?? []).map((c) => c.course_id)
        );

        // Build a map of course_id -> completed lesson count
        const completedPerCourse = new Map<string, number>();
        for (const row of progressRows ?? []) {
          completedPerCourse.set(
            row.course_id,
            (completedPerCourse.get(row.course_id) ?? 0) + 1
          );
        }

        const streak: StreakData = {
          ...streakData,
          streakHistory,
        };

        const recentActivity =
          transactions?.map((tx) => {
            return {
              action: tx.reason,
              detail: "",
              xp: tx.amount,
              time: tx.created_at,
            };
          }) ?? [];

        // Resolve enrolled course titles and lesson counts from Sanity CMS
        // Exclude courses that already have a minted certificate
        const allEnrolledIds = enrollments?.map((e) => e.course_id) ?? [];
        const enrolledIds = allEnrolledIds.filter(
          (id) => !mintedCourseIds.has(id)
        );
        // Exclude both enrolled and completed courses from recommendations
        const excludeFromRecommended = [
          ...new Set([...allEnrolledIds, ...mintedCourseIds]),
        ];
        const [courseSummaries, recommended] = await Promise.all([
          enrolledIds.length > 0
            ? getCoursesByIds(enrolledIds)
            : Promise.resolve([]),
          getRecommendedCourses(excludeFromRecommended),
        ]);
        // Build a lookup map: course _id -> Sanity data
        const courseMap = new Map(courseSummaries.map((c) => [c._id, c]));

        const currentCourses: CurrentCourse[] = enrolledIds.map((id) => {
          const sanity = courseMap.get(id);
          return {
            courseId: id,
            title: sanity?.title ?? id,
            slug: sanity?.slug ?? id,
            completedLessons: completedPerCourse.get(id) ?? 0,
            totalLessons: sanity?.totalLessons ?? 0,
          };
        });

        setData({
          xp: totalXp,
          level: calculateLevel(totalXp),
          streak,
          achievementsCount: achievementsCount ?? 0,
          currentCourses,
          recommendedCourses: recommended,
          recentActivity,
          username: profile?.username ?? "Builder",
          userId: user.id,
          nameRerollsUsed: rerollData?.name_rerolls_used ?? -1,
          isLoading: false,
          fetchError: false,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[Dashboard] Data fetch failed:", message);
        setData((prev) => ({
          ...prev,
          isLoading: false,
          fetchError: true,
        }));
      }
    }

    fetchData();
  }, []);

  return data;
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tGamification = useTranslations("gamification");
  const tCourses = useTranslations("courses");
  const tCerts = useTranslations("certificates");
  const tTime = useTranslations("timeAgo");
  const locale = useLocale();
  const data = useDashboardData();
  const [courses, setCourses] = useState<CurrentCourse[]>([]);
  const [showNameReveal, setShowNameReveal] = useState(false);
  const [dashboardUsername, setDashboardUsername] = useState(data.username);

  // Show name reveal modal on first visit (rerolls === 0 means never seen)
  useEffect(() => {
    if (
      !data.isLoading &&
      data.nameRerollsUsed === 0 &&
      data.userId &&
      !localStorage.getItem("nameRevealSeen")
    ) {
      setShowNameReveal(true);
    }
  }, [data.isLoading, data.nameRerollsUsed, data.userId]);

  // Keep username in sync
  useEffect(() => {
    setDashboardUsername(data.username);
  }, [data.username]);

  const handleNameChange = async (
    newName: string,
    newRerollsUsed: number
  ): Promise<boolean> => {
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ username: newName, name_rerolls_used: newRerollsUsed })
      .eq("id", data.userId);
    if (!error) setDashboardUsername(newName);
    return !error;
  };

  const handleNameConfirm = () => {
    localStorage.setItem("nameRevealSeen", "1");
    setShowNameReveal(false);
  };

  // Sync local courses state with data hook
  useEffect(() => {
    setCourses(data.currentCourses);
  }, [data.currentCourses]);

  const handleUnenroll = useCallback(async (courseId: string) => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { error } = await supabase
      .from("enrollments")
      .delete()
      .eq("user_id", session.user.id)
      .eq("course_id", courseId);

    if (!error) {
      setCourses((prev) => prev.filter((c) => c.courseId !== courseId));
    }
  }, []);

  const handleMintSuccess = useCallback(
    async (courseId: string, courseTitle: string, result: MintResult) => {
      const supabase = createClient();

      await supabase.from("certificates").insert({
        user_id: data.userId,
        course_id: courseId,
        course_title: courseTitle,
        mint_address: result.mintAddress,
        metadata_uri: result.metadataUri,
      });

      // Remove the course from the dashboard list after minting
      setCourses((prev) => prev.filter((c) => c.courseId !== courseId));
    },
    [data.userId]
  );

  const formatTimeAgo = (isoDate: string): string => {
    const createdAt = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      return tTime("justNow");
    } else if (diffHours < 24) {
      return tTime("hours", { count: diffHours });
    } else {
      return tTime("days", { count: Math.floor(diffHours / 24) });
    }
  };

  if (data.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (data.fetchError) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <WarningOctagon
              size={48}
              weight="duotone"
              className="text-danger"
              aria-hidden="true"
            />
            <div>
              <h2 className="font-display text-lg font-bold">
                {t("fetchError")}
              </h2>
              <p className="mt-1 text-sm text-text-3">
                {t("fetchErrorDetail")}
              </p>
            </div>
            <Button variant="push" onClick={() => window.location.reload()}>
              {t("retryLoad")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-text-3">
          {t("welcome", { name: dashboardUsername })}
        </p>
      </div>

      {/* Stats Row: Streak (2 cols) | XP | Achievements */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Streak — spans 2 columns */}
        <div className="lg:col-span-2">
          <StreakDisplay streak={data.streak} className="h-full" />
        </div>

        {/* XP Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-sm font-bold text-text-3">
                  {tGamification("xp")}
                </p>
                <p className="mt-1 font-display text-5xl font-black text-primary">
                  {data.xp.toLocaleString()}
                </p>
              </div>
              <LevelBadge level={data.level} size="lg" />
            </div>
            {(() => {
              const currentLevelXp = data.level ** 2 * 100;
              const nextLevelXp = (data.level + 1) ** 2 * 100;
              const progressInLevel = data.xp - currentLevelXp;
              const xpNeededForLevel = nextLevelXp - currentLevelXp;
              return (
                <>
                  <ProgressBar
                    value={progressInLevel}
                    max={xpNeededForLevel}
                    className="mt-3"
                  />
                  <p className="mt-1.5 text-xs text-text-3">
                    {tGamification("xpToNextLevel", {
                      current: progressInLevel,
                      needed: xpNeededForLevel,
                      level: data.level + 1,
                    })}
                  </p>
                </>
              );
            })()}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Trophy
                size={20}
                weight="duotone"
                className="text-accent"
                aria-hidden="true"
              />
              <p className="text-sm text-text-3">
                {tGamification("achievements")}
              </p>
            </div>
            <p className="mt-1 font-display text-4xl font-black">
              {data.achievementsCount}
            </p>
            <p className="mt-1 text-xs text-text-3">
              {tGamification("badges")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Courses */}
      <div className="space-y-4">
        <h2 className="font-display text-xl font-bold">
          {t("currentCourses")}
        </h2>
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const isComplete =
                course.completedLessons >= course.totalLessons &&
                course.totalLessons > 0;
              const percent =
                course.totalLessons > 0
                  ? Math.round(
                      (course.completedLessons / course.totalLessons) * 100
                    )
                  : 0;

              return (
                <Card
                  key={course.courseId}
                  className="group relative overflow-hidden"
                >
                  {/* Remove button — visible on hover */}
                  {!isComplete && (
                    <button
                      onClick={() => handleUnenroll(course.courseId)}
                      className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full text-danger opacity-0 transition-all hover:scale-110 hover:bg-danger hover:text-white hover:shadow-md group-hover:opacity-100"
                      aria-label={t("removeCourse")}
                    >
                      <X size={12} weight="bold" />
                    </button>
                  )}

                  <Link href={`/${locale}/courses/${course.slug}`}>
                    <CardContent className="p-4 transition-colors group-hover:bg-subtle">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-bg">
                          <BookOpen
                            size={18}
                            weight="duotone"
                            className="text-primary"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {course.title}
                          </p>
                          <p className="mt-0.5 text-xs text-text-3">
                            {course.completedLessons}/{course.totalLessons}{" "}
                            {tCourses("lessons")}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <ProgressBar
                          value={course.completedLessons}
                          max={course.totalLessons}
                          className="flex-1"
                        />
                        <span className="text-xs font-medium tabular-nums text-text-3">
                          {percent}%
                        </span>
                      </div>
                    </CardContent>
                  </Link>

                  {/* Completed course: blurred mint overlay */}
                  {isComplete && data.userId && (
                    <div className="bg-bg/95 absolute inset-0 z-10 flex flex-col items-center justify-center px-5 backdrop-blur-md">
                      <div className="flex items-center gap-2">
                        <GraduationCap
                          size={18}
                          weight="duotone"
                          className="shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <span className="text-sm font-medium">
                          {tCerts("courseComplete")}
                        </span>
                      </div>
                      <MintButton
                        metadata={
                          {
                            courseId: course.courseId,
                            courseName: course.title,
                            recipientName: data.username,
                            completionDate: new Date().toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            ),
                            imageUrl:
                              typeof window !== "undefined"
                                ? `${window.location.origin}/cover.png`
                                : "",
                          } satisfies CertificateMetadata
                        }
                        onSuccess={(result) =>
                          handleMintSuccess(
                            course.courseId,
                            course.title,
                            result
                          )
                        }
                        className="mt-3 h-8 px-3 text-xs"
                      />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <BookOpen
              size={48}
              weight="duotone"
              className="mb-3 text-text-3"
              aria-hidden="true"
            />
            <p className="text-text-3">{t("noCourses")}</p>
            <Link
              href={`/${locale}/courses`}
              className="hover:bg-primary/90 mt-4 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              {t("browseCourses")}
            </Link>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <h2 className="font-display text-xl font-bold">
          {t("recentActivity")}
        </h2>
        <Card>
          <CardContent className="p-0">
            {data.recentActivity.length > 0 ? (
              <div className="divide-y">
                {data.recentActivity.map((activity, index) => (
                  <div
                    key={`activity-${index}`}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-subtle">
                        <Lightning
                          size={16}
                          weight="duotone"
                          className="text-accent"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {activity.action}
                        </p>
                        {activity.detail && (
                          <p className="truncate text-xs text-text-3">
                            {activity.detail}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {activity.xp > 0 && (
                        <span className="font-display text-xs font-bold text-accent">
                          +{activity.xp} XP
                        </span>
                      )}
                      <span className="text-xs text-text-3">
                        {formatTimeAgo(activity.time)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-sm text-text-3">{t("noRecentActivity")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommended Courses */}
      <div className="space-y-4">
        <h2 className="font-display text-xl font-bold">
          {t("recommendedCourses")}
        </h2>
        {data.recommendedCourses.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.recommendedCourses.map((course) => (
              <CourseCard
                key={course._id}
                slug={course.slug}
                title={course.title}
                description={course.description}
                difficulty={
                  course.difficulty as "beginner" | "intermediate" | "advanced"
                }
                duration={course.duration}
                xpReward={course.xpReward}
                instructorName={course.instructor?.name ?? ""}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <p className="text-sm text-text-3">{t("noCourses")}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Name reveal modal — shown on first login */}
      <Dialog open={showNameReveal} onOpenChange={handleNameConfirm}>
        <DialogContent className="sm:max-w-md">
          <div className="py-4">
            <WalletNameGenerator
              currentName={dashboardUsername}
              rerollsUsed={data.nameRerollsUsed}
              animateOnMount
              onNameChange={handleNameChange}
              onConfirm={handleNameConfirm}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
