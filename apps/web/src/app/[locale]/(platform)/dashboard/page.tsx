"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  BookOpen,
  Trophy,
  Lightning,
  Medal,
  Scroll,
  GraduationCap,
  ArrowSquareOut,
  X,
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
import { CourseCompletionMint } from "@/components/certificates/course-completion-mint";
import { WalletNameGenerator } from "@/components/profile/wallet-name-generator";
import { createClient } from "@/lib/supabase/client";
import { buildCloseEnrollmentInstruction } from "@/lib/solana/instructions";
import { getProgressService } from "@/lib/services";
import { calculateLevel } from "@/lib/gamification/xp";
import {
  getCoursesByIds,
  getLessonsByIds,
  getRecommendedCourses,
  type RecommendedCourse,
} from "@/lib/sanity/queries";

const SOLANA_CLUSTER = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";
function explorerTxUrl(sig: string): string {
  return SOLANA_CLUSTER === "mainnet-beta"
    ? `https://explorer.solana.com/tx/${sig}`
    : `https://explorer.solana.com/tx/${sig}?cluster=${SOLANA_CLUSTER}`;
}

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
    type:
      | "lesson"
      | "challenge"
      | "course_complete"
      | "achievement"
      | "certificate"
      | "enrollment"
      | "xp_other";
    action: string;
    xp: number;
    time: string;
    href: string | null;
    txSignature: string | null;
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

        // Fetch recent XP transactions (15 to have headroom for multi-source merge)
        const { data: transactions } = await supabase
          .from("xp_transactions")
          .select("amount, reason, created_at, tx_signature")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(15);

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

        // Fetch enrollments, progress, certificates, and achievements in parallel
        const [
          { data: enrollments },
          { data: progressRows },
          { data: certRows },
          { data: achievementRows },
        ] = await Promise.all([
          supabase
            .from("enrollments")
            .select("course_id, enrolled_at, tx_signature")
            .eq("user_id", user.id),
          supabase
            .from("user_progress")
            .select("course_id, lesson_id, completed")
            .eq("user_id", user.id)
            .eq("completed", true),
          supabase
            .from("certificates")
            .select("course_id, course_title, minted_at, tx_signature")
            .eq("user_id", user.id),
          supabase
            .from("user_achievements")
            .select("achievement_id, unlocked_at, tx_signature")
            .eq("user_id", user.id)
            .order("unlocked_at", { ascending: false })
            .limit(10),
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

        // Parse lesson/challenge/course-complete IDs from transaction reasons
        const lessonPattern = /^Completed lesson:\s*(.+)$/;
        const challengePattern = /^Completed challenge:\s*(.+)$/;
        const courseCompletePattern = /^Completed course:\s*(.+)$/;
        const lessonIdsFromTx: string[] = [];
        const courseCompleteIdsFromTx: string[] = [];
        for (const tx of transactions ?? []) {
          const lessonMatch = lessonPattern.exec(tx.reason);
          const challengeMatch = challengePattern.exec(tx.reason);
          const courseMatch = courseCompletePattern.exec(tx.reason);
          const lessonOrChallengeId = lessonMatch?.[1] ?? challengeMatch?.[1];
          if (lessonOrChallengeId) lessonIdsFromTx.push(lessonOrChallengeId);
          if (courseMatch?.[1]) courseCompleteIdsFromTx.push(courseMatch[1]);
        }

        // Fetch lesson titles/slugs from Sanity
        const uniqueLessonIds = [...new Set(lessonIdsFromTx)];
        const lessonSummaries =
          uniqueLessonIds.length > 0
            ? await getLessonsByIds(uniqueLessonIds)
            : [];
        const lessonMap = new Map(lessonSummaries.map((l) => [l._id, l]));

        // Map lesson_id -> course_id from progress rows
        const lessonToCourse = new Map<string, string>();
        for (const row of progressRows ?? []) {
          lessonToCourse.set(row.lesson_id, row.course_id);
        }

        // Resolve enrolled course titles and lesson counts from Sanity CMS
        // Exclude courses that already have a minted certificate
        const allEnrolledIds = enrollments?.map((e) => e.course_id) ?? [];
        const enrolledIds = allEnrolledIds.filter(
          (id) => !mintedCourseIds.has(id)
        );
        // Also include course IDs referenced in recent activity (may be minted/unenrolled)
        const activityCourseIds = uniqueLessonIds
          .map((lid) => lessonToCourse.get(lid))
          .filter((cid): cid is string => !!cid);
        // Use allEnrolledIds (not enrolledIds) so completed/minted courses resolve
        // titles in the enrollment activity feed items.
        const allCourseIdsToFetch = [
          ...new Set([
            ...allEnrolledIds,
            ...activityCourseIds,
            ...courseCompleteIdsFromTx,
          ]),
        ];
        // Exclude both enrolled and completed courses from recommendations
        const excludeFromRecommended = [
          ...new Set([...allEnrolledIds, ...mintedCourseIds]),
        ];
        const [courseSummaries, recommended] = await Promise.all([
          allCourseIdsToFetch.length > 0
            ? getCoursesByIds(allCourseIdsToFetch)
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

        // Build multi-source activity feed. Each source uses a different timestamp
        // column name; normalise all to `time` before merging and sorting.
        type ActivityType =
          | "lesson"
          | "challenge"
          | "course_complete"
          | "achievement"
          | "certificate"
          | "enrollment"
          | "xp_other";
        type RawActivity = {
          type: ActivityType;
          action: string;
          xp: number;
          time: string;
          href: string | null;
          txSignature: string | null;
        };
        const raw: RawActivity[] = [];

        // 1. XP transactions → lessons, challenges, course completions, generic XP
        for (const tx of transactions ?? []) {
          const lessonMatch = lessonPattern.exec(tx.reason);
          const challengeMatch = challengePattern.exec(tx.reason);
          const courseMatch = courseCompletePattern.exec(tx.reason);

          if (lessonMatch?.[1]) {
            const lesson = lessonMap.get(lessonMatch[1]);
            const cId = lessonToCourse.get(lessonMatch[1]);
            const course = cId ? courseMap.get(cId) : undefined;
            raw.push({
              type: "lesson",
              action: lesson ? `Completed lesson: ${lesson.title}` : tx.reason,
              xp: tx.amount,
              time: tx.created_at,
              txSignature: tx.tx_signature ?? null,
              href:
                lesson && course
                  ? `/courses/${course.slug}/lessons/${lesson.slug}`
                  : null,
            });
          } else if (challengeMatch?.[1]) {
            const lesson = lessonMap.get(challengeMatch[1]);
            const cId = lessonToCourse.get(challengeMatch[1]);
            const course = cId ? courseMap.get(cId) : undefined;
            raw.push({
              type: "challenge",
              action: lesson
                ? `Completed challenge: ${lesson.title}`
                : tx.reason,
              xp: tx.amount,
              time: tx.created_at,
              txSignature: tx.tx_signature ?? null,
              href:
                lesson && course
                  ? `/courses/${course.slug}/lessons/${lesson.slug}`
                  : null,
            });
          } else if (courseMatch?.[1]) {
            const course = courseMap.get(courseMatch[1]);
            raw.push({
              type: "course_complete",
              action: course ? `Completed course: ${course.title}` : tx.reason,
              xp: tx.amount,
              time: tx.created_at,
              txSignature: tx.tx_signature ?? null,
              href: course ? `/courses/${course.slug}` : null,
            });
          } else {
            raw.push({
              type: "xp_other",
              action: tx.reason,
              xp: tx.amount,
              time: tx.created_at,
              txSignature: tx.tx_signature ?? null,
              href: null,
            });
          }
        }

        // 2. Achievement unlocks
        for (const row of achievementRows ?? []) {
          const name = row.achievement_id
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c: string) => c.toUpperCase());
          raw.push({
            type: "achievement",
            action: `Achievement unlocked: ${name}`,
            xp: 0,
            time: row.unlocked_at,
            txSignature: row.tx_signature ?? null,
            href: null,
          });
        }

        // 3. Certificate mints
        for (const cert of certRows ?? []) {
          if (!cert.minted_at) continue;
          raw.push({
            type: "certificate",
            action: `Certificate earned: ${cert.course_title}`,
            xp: 0,
            time: cert.minted_at,
            txSignature: cert.tx_signature ?? null,
            href: `/certificates`,
          });
        }

        // 4. Course enrollments
        for (const enrollment of enrollments ?? []) {
          if (!enrollment.enrolled_at) continue;
          const course = courseMap.get(enrollment.course_id);
          raw.push({
            type: "enrollment",
            action: course
              ? `Enrolled in ${course.title}`
              : `Enrolled in course`,
            xp: 0,
            time: enrollment.enrolled_at,
            txSignature: enrollment.tx_signature ?? null,
            href: course ? `/courses/${course.slug}` : null,
          });
        }

        // Sort all sources by time descending, take top 10
        raw.sort(
          (a: RawActivity, b: RawActivity) =>
            new Date(b.time).getTime() - new Date(a.time).getTime()
        );
        const recentActivity = raw.slice(0, 10).map((item) => ({
          type: item.type,
          action: item.action,
          xp: item.xp,
          time: item.time,
          href: item.href,
          txSignature: item.txSignature,
        }));

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
  const tTime = useTranslations("timeAgo");
  const locale = useLocale();
  const data = useDashboardData();
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [courses, setCourses] = useState<CurrentCourse[]>([]);
  const [unenrollingId, setUnenrollingId] = useState<string | null>(null);
  const [showNameReveal, setShowNameReveal] = useState(false);
  const [dashboardUsername, setDashboardUsername] = useState(data.username);
  const [activityPage, setActivityPage] = useState(0);
  const ACTIVITY_PAGE_SIZE = 5;

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

  const handleUnenroll = useCallback(
    async (courseId: string) => {
      setUnenrollingId(courseId);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setUnenrollingId(null);
        return;
      }

      // Attempt to close the on-chain Enrollment PDA (returns SOL rent to learner).
      // If the wallet is connected and the TX succeeds, sync via API.
      // If no wallet or TX fails, fall through to direct Supabase delete
      // (the PDA may not exist if the user enrolled before on-chain was live).
      if (publicKey && sendTransaction) {
        try {
          const ix = buildCloseEnrollmentInstruction(courseId, publicKey);
          const tx = new Transaction().add(ix);
          const sig = await sendTransaction(tx, connection);
          await connection.confirmTransaction(sig, "confirmed");

          // On-chain TX succeeded — Helius webhook will sync Supabase.
          // Optimistically update UI.
          setCourses((prev) => prev.filter((c) => c.courseId !== courseId));
          setUnenrollingId(null);
          return;
        } catch {
          // On-chain close failed (PDA may not exist) — fall through to Supabase delete
        }
      }

      // Fallback: remove from Supabase directly (no on-chain PDA, or TX failed)
      const { error } = await supabase
        .from("enrollments")
        .delete()
        .eq("user_id", session.user.id)
        .eq("course_id", courseId);

      if (!error) {
        setCourses((prev) => prev.filter((c) => c.courseId !== courseId));
      }
      setUnenrollingId(null);
    },
    [publicKey, sendTransaction, connection]
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
                      disabled={unenrollingId === course.courseId}
                      className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full text-danger opacity-0 transition-all hover:scale-110 hover:bg-danger hover:text-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-100 group-hover:opacity-100"
                      aria-label={t("removeCourse")}
                    >
                      {unenrollingId === course.courseId ? (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <X size={12} weight="bold" />
                      )}
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
                      <CourseCompletionMint
                        courseId={course.courseId}
                        userId={data.userId}
                        totalLessons={course.totalLessons}
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
              <>
                <div className="divide-y">
                  {data.recentActivity
                    .slice(
                      activityPage * ACTIVITY_PAGE_SIZE,
                      (activityPage + 1) * ACTIVITY_PAGE_SIZE
                    )
                    .map((activity) => {
                      const iconConfig = {
                        lesson: { Icon: Lightning, cls: "text-accent" },
                        challenge: { Icon: Lightning, cls: "text-accent" },
                        course_complete: {
                          Icon: GraduationCap,
                          cls: "text-primary",
                        },
                        achievement: { Icon: Medal, cls: "text-accent" },
                        certificate: { Icon: Scroll, cls: "text-primary" },
                        enrollment: { Icon: BookOpen, cls: "text-primary" },
                        xp_other: { Icon: Lightning, cls: "text-accent" },
                      }[activity.type] ?? {
                        Icon: Lightning,
                        cls: "text-accent",
                      };
                      const { Icon: ActivityIcon, cls: iconCls } = iconConfig;

                      const content = (
                        <div className="flex items-center justify-between px-4 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-subtle">
                              <ActivityIcon
                                size={16}
                                weight="duotone"
                                className={iconCls}
                                aria-hidden="true"
                              />
                            </div>
                            <p className="truncate text-sm font-medium">
                              {activity.action}
                            </p>
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
                            {activity.txSignature && (
                              <ArrowSquareOut
                                size={14}
                                className="shrink-0 text-text-3"
                                aria-hidden="true"
                              />
                            )}
                          </div>
                        </div>
                      );

                      if (activity.txSignature) {
                        return (
                          <a
                            key={`${activity.type}-${activity.time}`}
                            href={explorerTxUrl(activity.txSignature)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block transition-colors hover:bg-subtle"
                          >
                            {content}
                          </a>
                        );
                      }
                      return (
                        <div key={`${activity.type}-${activity.time}`}>
                          {content}
                        </div>
                      );
                    })}
                </div>
                {data.recentActivity.length > ACTIVITY_PAGE_SIZE && (
                  <div className="flex items-center justify-end gap-1 border-t px-4 py-3">
                    {Array.from(
                      {
                        length: Math.ceil(
                          data.recentActivity.length / ACTIVITY_PAGE_SIZE
                        ),
                      },
                      (_, i) => (
                        <button
                          key={i}
                          onClick={() => setActivityPage(i)}
                          aria-current={activityPage === i ? "page" : undefined}
                          className={`flex h-7 w-7 items-center justify-center rounded text-sm font-medium transition-colors ${
                            activityPage === i
                              ? "bg-primary text-primary-foreground"
                              : "text-text-3 hover:bg-subtle"
                          }`}
                        >
                          {i + 1}
                        </button>
                      )
                    )}
                  </div>
                )}
              </>
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
