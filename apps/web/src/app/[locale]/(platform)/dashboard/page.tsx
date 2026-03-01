"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  BookOpen,
  CaretLeft,
  CaretRight,
  Lightning,
  Medal,
  Scroll,
  GraduationCap,
  ArrowSquareOut,
  X,
  WarningOctagon,
} from "@phosphor-icons/react";
import type { StreakData, DailyQuest } from "@superteam-lms/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DashboardIdentityPanel } from "@/components/gamification/dashboard-identity-panel";
import { CourseCard } from "@/components/course/course-card";
import { CourseCompletionMint } from "@/components/certificates/course-completion-mint";
import { WalletNameGenerator } from "@/components/profile/wallet-name-generator";
import { useAuth } from "@/lib/auth/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { buildCloseEnrollmentInstruction } from "@/lib/solana/instructions";
import {
  parseProgramError,
  preflightTransaction,
} from "@/lib/solana/program-errors";
import { dispatchToast } from "@/components/ui/toast-container";
import { getProgressService } from "@/lib/services";
import { calculateLevel } from "@/lib/gamification/xp";
import {
  getCoursesByIds,
  getLessonsByIds,
  getRecommendedCourses,
  getAllAchievements,
  type RecommendedCourse,
  type DeployedAchievement,
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
  difficulty: string;
  learningPath: string | null;
  thumbnail: string | null;
}

interface DashboardData {
  xp: number;
  level: number;
  streak: StreakData;
  achievementsCount: number;
  /** Full Sanity _ids of achievements unlocked by this user */
  unlockedAchievementIds: string[];
  /** All achievements from Sanity — single source of truth for catalog */
  achievementCatalog: DeployedAchievement[];
  quests: DailyQuest[];
  questsResetTime: string;
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

function useDashboardData(
  authUserId: string | null,
  authLoading: boolean
): DashboardData {
  const [data, setData] = useState<DashboardData>({
    xp: 0,
    level: 0,
    streak: defaultStreak,
    achievementsCount: 0,
    unlockedAchievementIds: [],
    achievementCatalog: [],
    quests: [],
    questsResetTime: "",
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
    if (authLoading) return;

    async function fetchData() {
      try {
        if (!authUserId) {
          setData((prev) => ({ ...prev, isLoading: false }));
          return;
        }

        const supabase = createClient();

        // Evaluate quests FIRST — this may trigger on-chain XP mints.
        // Awaiting before XP read avoids showing a stale balance.
        const questsResult = await fetch("/api/quests/daily")
          .then((res) =>
            res.ok ? res.json() : { quests: [], nextResetTime: "" }
          )
          .catch(() => ({ quests: [], nextResetTime: "" }));

        // Fetch XP + streak via service layer (on-chain first, Supabase fallback)
        const service = getProgressService(supabase);
        const [totalXp, streakData] = await Promise.all([
          service.getXP(authUserId),
          service.getStreak(authUserId),
        ]);

        // Fetch profile — separate name_rerolls_used to avoid breaking the
        // whole query if the column hasn't been migrated yet
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", authUserId)
          .single();

        const { data: rerollData } = await supabase
          .from("profiles")
          .select("name_rerolls_used")
          .eq("id", authUserId)
          .single();

        // Fetch achievements count
        const { count: achievementsCount } = await supabase
          .from("user_achievements")
          .select("id", { count: "exact", head: true })
          .eq("user_id", authUserId);

        // Fetch all XP transactions for the activity feed
        const { data: transactions } = await supabase
          .from("xp_transactions")
          .select("amount, reason, created_at, tx_signature")
          .eq("user_id", authUserId)
          .order("created_at", { ascending: false });

        // Fetch activity dates for streak heatmap (last 270 days)
        const oneYearAgo = new Date();
        oneYearAgo.setDate(oneYearAgo.getDate() - 270);
        const { data: activityRows } = await supabase
          .from("xp_transactions")
          .select("created_at")
          .eq("user_id", authUserId)
          .gte("created_at", oneYearAgo.toISOString());

        const streakHistory: Record<string, number> = {};
        for (const row of activityRows ?? []) {
          const dateStr = (row.created_at ?? "").split("T")[0] as string;
          streakHistory[dateStr] = (streakHistory[dateStr] ?? 0) + 1;
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
            .eq("user_id", authUserId),
          supabase
            .from("user_progress")
            .select("course_id, lesson_id, completed")
            .eq("user_id", authUserId)
            .eq("completed", true),
          supabase
            .from("certificates")
            .select("course_id, course_title, minted_at, tx_signature")
            .eq("user_id", authUserId),
          supabase
            .from("user_achievements")
            .select("achievement_id, unlocked_at, tx_signature")
            .eq("user_id", authUserId)
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
        const achievementRewardPattern = /^Achievement reward:\s*(.+)$/;
        const courseCompletionBonusPattern =
          /^Course completion bonus:\s*(.+)$/;
        const dailyQuestPattern = /^daily_quest:(.+)$/;
        const lessonIdsFromTx: string[] = [];
        const courseCompleteIdsFromTx: string[] = [];
        for (const tx of transactions ?? []) {
          const lessonMatch = lessonPattern.exec(tx.reason);
          const challengeMatch = challengePattern.exec(tx.reason);
          const courseMatch = courseCompletePattern.exec(tx.reason);
          const bonusMatch = courseCompletionBonusPattern.exec(tx.reason);
          const lessonOrChallengeId = lessonMatch?.[1] ?? challengeMatch?.[1];
          if (lessonOrChallengeId) lessonIdsFromTx.push(lessonOrChallengeId);
          if (courseMatch?.[1]) courseCompleteIdsFromTx.push(courseMatch[1]);
          if (bonusMatch?.[1]) courseCompleteIdsFromTx.push(bonusMatch[1]);
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
        const [courseSummaries, recommended, achievementCatalog] =
          await Promise.all([
            allCourseIdsToFetch.length > 0
              ? getCoursesByIds(allCourseIdsToFetch)
              : Promise.resolve([]),
            getRecommendedCourses(excludeFromRecommended),
            getAllAchievements(),
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
            difficulty: sanity?.difficulty ?? "beginner",
            learningPath: sanity?.learningPath ?? null,
            thumbnail: sanity?.thumbnail ?? null,
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
              time: tx.created_at ?? new Date().toISOString(),
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
              time: tx.created_at ?? new Date().toISOString(),
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
              time: tx.created_at ?? new Date().toISOString(),
              txSignature: tx.tx_signature ?? null,
              href: course ? `/courses/${course.slug}` : null,
            });
          } else if (achievementRewardPattern.exec(tx.reason)?.[1]) {
            const rawId = tx.reason.match(achievementRewardPattern)![1]!;
            const name = rawId
              .replace(/^achievement-/, "")
              .replace(/[-_]/g, " ")
              .replace(/\b\w/g, (c: string) => c.toUpperCase());
            raw.push({
              type: "xp_other",
              action: `Achievement reward: ${name}`,
              xp: tx.amount,
              time: tx.created_at ?? new Date().toISOString(),
              txSignature: tx.tx_signature ?? null,
              href: null,
            });
          } else if (courseCompletionBonusPattern.exec(tx.reason)?.[1]) {
            const courseId = tx.reason.match(courseCompletionBonusPattern)![1]!;
            const course = courseMap.get(courseId);
            raw.push({
              type: "course_complete",
              action: course
                ? `Course completion bonus: ${course.title}`
                : tx.reason,
              xp: tx.amount,
              time: tx.created_at ?? new Date().toISOString(),
              txSignature: tx.tx_signature ?? null,
              href: course ? `/courses/${course.slug}` : null,
            });
          } else if (dailyQuestPattern.exec(tx.reason)?.[1]) {
            const questId = tx.reason.match(dailyQuestPattern)![1]!;
            const questName = questId
              .replace(/^quest-/, "")
              .replace(/[-_]/g, " ")
              .replace(/\b\w/g, (c: string) => c.toUpperCase());
            raw.push({
              type: "xp_other",
              action: `Daily Quest: ${questName}`, // TODO: i18n
              xp: tx.amount,
              time: tx.created_at ?? new Date().toISOString(),
              txSignature: tx.tx_signature ?? null,
              href: null,
            });
          } else {
            raw.push({
              type: "xp_other",
              action: tx.reason,
              xp: tx.amount,
              time: tx.created_at ?? new Date().toISOString(),
              txSignature: tx.tx_signature ?? null,
              href: null,
            });
          }
        }

        // 2. Achievement unlocks
        for (const row of achievementRows ?? []) {
          const name = row.achievement_id
            .replace(/^achievement-/, "")
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, (c: string) => c.toUpperCase());
          raw.push({
            type: "achievement",
            action: `Achievement unlocked: ${name}`,
            xp: 0,
            time: row.unlocked_at ?? new Date().toISOString(),
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

        // Sort all sources by time descending
        raw.sort(
          (a: RawActivity, b: RawActivity) =>
            new Date(b.time).getTime() - new Date(a.time).getTime()
        );
        const recentActivity = raw.map((item) => ({
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
          unlockedAchievementIds: (achievementRows ?? []).map(
            (r) => r.achievement_id
          ),
          achievementCatalog,
          quests: questsResult.quests ?? [],
          questsResetTime: questsResult.nextResetTime ?? "",
          currentCourses,
          recommendedCourses: recommended,
          recentActivity,
          username: profile?.username ?? "Builder",
          userId: authUserId,
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
  }, [authUserId, authLoading]);

  return data;
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const tCourses = useTranslations("courses");
  const tErrors = useTranslations("programErrors");
  const tTime = useTranslations("timeAgo");
  const locale = useLocale();
  const { userId: authUserId, isLoading: authLoading } = useAuth();
  const data = useDashboardData(authUserId, authLoading);
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const [courses, setCourses] = useState<CurrentCourse[]>([]);
  const [unenrollingId, setUnenrollingId] = useState<string | null>(null);
  const [showNameReveal, setShowNameReveal] = useState(false);
  const [dashboardUsername, setDashboardUsername] = useState(data.username);
  const [activityPage, setActivityPage] = useState(0);
  const ACTIVITY_PAGE_SIZE = 10;
  const totalActivityPages = Math.ceil(
    data.recentActivity.length / ACTIVITY_PAGE_SIZE
  );

  // Group paginated activity items by date for history-style browsing
  const activityPageItems = data.recentActivity.slice(
    activityPage * ACTIVITY_PAGE_SIZE,
    (activityPage + 1) * ACTIVITY_PAGE_SIZE
  );
  const todayDateStr = new Date().toISOString().split("T")[0]!;
  const yesterdayDateStr = new Date(Date.now() - 86400000)
    .toISOString()
    .split("T")[0]!;
  const activityDateGroups: {
    date: string;
    label: string;
    items: typeof activityPageItems;
  }[] = [];
  let lastGroupDate = "";
  for (const item of activityPageItems) {
    const dateStr = item.time.split("T")[0]!;
    if (dateStr !== lastGroupDate) {
      lastGroupDate = dateStr;
      let label: string;
      if (dateStr === todayDateStr) label = tTime("today");
      else if (dateStr === yesterdayDateStr) label = tTime("yesterday");
      else {
        const d = new Date(dateStr + "T00:00:00");
        label = d.toLocaleDateString(locale, {
          month: "short",
          day: "numeric",
        });
      }
      activityDateGroups.push({ date: dateStr, label, items: [] });
    }
    activityDateGroups[activityDateGroups.length - 1]!.items.push(item);
  }

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
      if (!publicKey) {
        setWalletModalVisible(true);
        return;
      }

      setUnenrollingId(courseId);

      const withTimeout = <T,>(
        p: Promise<T>,
        ms: number,
        label: string
      ): Promise<T> =>
        Promise.race([
          p,
          new Promise<never>((_, rej) =>
            setTimeout(() => rej(new Error(`${label} timed out`)), ms)
          ),
        ]);

      try {
        const ix = buildCloseEnrollmentInstruction(courseId, publicKey);
        const tx = new Transaction().add(ix);

        // Pre-simulate to catch program errors before wallet popup.
        // Backpack hangs if simulation fails inside sendTransaction.
        await preflightTransaction(tx, connection, publicKey);

        const sig = await withTimeout(
          sendTransaction(tx, connection, { skipPreflight: true }),
          30_000,
          "Wallet signing"
        );
        await withTimeout(
          connection.confirmTransaction(sig, "confirmed"),
          30_000,
          "Confirmation"
        );

        // On-chain TX succeeded — Helius webhook will sync Supabase.
        // Optimistically update UI.
        setCourses((prev) => prev.filter((c) => c.courseId !== courseId));
        dispatchToast(t("unenrollSuccess"), "success");
      } catch (err: unknown) {
        const parsed = parseProgramError(err);
        const msg = parsed.i18nKey ? tErrors(parsed.i18nKey) : parsed.fallback;
        dispatchToast(msg, "warning");
      } finally {
        setUnenrollingId(null);
      }
    },
    [publicKey, sendTransaction, connection, setWalletModalVisible, t, tErrors]
  );

  const formatTimeAgo = (isoDate: string): string => {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return tTime("justNow");
    if (diffHours < 24) return tTime("hours", { count: diffHours });
    return tTime("days", { count: Math.floor(diffHours / 24) });
  };

  if (data.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="sol-spinner" />
        <span className="sr-only">Loading...</span>
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
              <h2 className="font-display text-lg font-black">
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
      <h1 className="font-display text-3xl font-black tracking-[-0.5px]">
        {t("title")}
      </h1>

      {/* V9 Dashboard Identity Panel — Level+XP | Medals | Activity Grid */}
      <DashboardIdentityPanel
        xp={data.xp}
        level={data.level}
        streak={data.streak}
        achievementsCount={data.achievementsCount}
        unlockedAchievementIds={data.unlockedAchievementIds}
        catalog={data.achievementCatalog}
        quests={data.quests}
        questsResetTime={data.questsResetTime}
      />

      {/* ═══ Current Courses ═══ */}
      <section className="cc-section">
        <div className="cc-section-head">
          <h2 className="cc-section-title">{t("currentCourses")}</h2>
          {courses.length > 0 && (
            <span className="cc-section-count">{courses.length}</span>
          )}
        </div>

        {courses.length > 0 ? (
          <div className="cc-grid">
            {courses.map((course, i) => {
              const isComplete =
                course.completedLessons >= course.totalLessons &&
                course.totalLessons > 0;
              const ringR = 15;
              const ringC = 2 * Math.PI * ringR;
              const progress =
                course.totalLessons > 0
                  ? course.completedLessons / course.totalLessons
                  : 0;
              const ringOffset = ringC * (1 - progress);

              return (
                <div
                  key={course.courseId}
                  className="cc-card"
                  style={{ "--i": i } as React.CSSProperties}
                >
                  {!isComplete && (
                    <button
                      onClick={() => handleUnenroll(course.courseId)}
                      disabled={unenrollingId === course.courseId}
                      className="cc-unenroll"
                      aria-label={t("removeCourse")}
                    >
                      {unenrollingId === course.courseId ? (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <X size={10} weight="bold" />
                      )}
                    </button>
                  )}

                  <Link href={`/${locale}/courses/${course.slug}`}>
                    <div className="cc-thumb" aria-hidden="true">
                      <img
                        src={course.thumbnail || "/cover.png"}
                        alt=""
                        width={400}
                        height={225}
                        loading="lazy"
                      />
                    </div>
                    <div className="cc-body">
                      <div className="cc-meta">
                        <div className="cc-title">{course.title}</div>
                        <span className="cc-sub">
                          {course.learningPath ?? tCourses(course.difficulty)}
                        </span>
                      </div>
                      <span className="cc-progress">
                        <span className="cc-ring-wrap">
                          <svg className="cc-ring" viewBox="0 0 36 36">
                            <circle
                              cx="18"
                              cy="18"
                              r={ringR}
                              className="cc-ring-track"
                            />
                            <circle
                              cx="18"
                              cy="18"
                              r={ringR}
                              strokeDasharray={ringC}
                              strokeDashoffset={ringOffset}
                              transform="rotate(-90 18 18)"
                              className="cc-ring-fill"
                            />
                          </svg>
                          <span className="cc-ring-count">
                            <span className="cc-ring-done">
                              {course.completedLessons}
                            </span>
                            /{course.totalLessons}
                          </span>
                        </span>
                        <span className="cc-ring-label">
                          {tCourses("lessons")}
                        </span>
                      </span>
                    </div>
                  </Link>

                  {isComplete && data.userId && (
                    <div className="bg-bg/95 absolute inset-0 z-10 flex flex-col items-center justify-center px-5 backdrop-blur-md">
                      <CourseCompletionMint
                        courseId={course.courseId}
                        userId={data.userId}
                        totalLessons={course.totalLessons}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="cc-empty">
            <BookOpen
              size={40}
              weight="duotone"
              className="text-text-3"
              aria-hidden="true"
            />
            <p className="text-text-3">{t("noCourses")}</p>
            <Link
              href={`/${locale}/courses`}
              className="mt-2 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:[background:var(--primary-hover)]"
            >
              {t("browseCourses")}
            </Link>
          </div>
        )}
      </section>

      {/* ═══ Activity ═══ */}
      <section className="act-section">
        <div className="act-section-head">
          <h2 className="act-section-title">{t("recentActivity")}</h2>
          {data.recentActivity.length > 0 && (
            <span className="act-section-count">
              {data.recentActivity.length}
            </span>
          )}
        </div>

        {data.recentActivity.length > 0 ? (
          <div className="act-panel">
            <div className="act-panel-amb" aria-hidden="true" />
            <div className="act-feed">
              {activityPageItems.map((activity) => {
                const iconMap = {
                  lesson: Lightning,
                  challenge: Lightning,
                  course_complete: GraduationCap,
                  achievement: Medal,
                  certificate: Scroll,
                  enrollment: BookOpen,
                  xp_other: Lightning,
                };
                const ActivityIcon = iconMap[activity.type] ?? Lightning;

                const inner = (
                  <>
                    <div className="act-left">
                      <div className={`act-icon ${activity.type}`}>
                        <ActivityIcon
                          size={16}
                          weight="duotone"
                          aria-hidden="true"
                        />
                      </div>
                      <span className="act-text">{activity.action}</span>
                    </div>
                    <div className="act-right">
                      {activity.xp > 0 && (
                        <span className="act-xp">+{activity.xp} XP</span>
                      )}
                      <span className="act-time">
                        {formatTimeAgo(activity.time)}
                      </span>
                      {activity.txSignature && (
                        <ArrowSquareOut
                          size={14}
                          className="act-tx"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  </>
                );

                return activity.txSignature ? (
                  <a
                    key={`${activity.type}-${activity.time}`}
                    href={explorerTxUrl(activity.txSignature)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="act-row"
                  >
                    {inner}
                  </a>
                ) : (
                  <div
                    key={`${activity.type}-${activity.time}`}
                    className="act-row"
                  >
                    {inner}
                  </div>
                );
              })}
            </div>
            {totalActivityPages > 1 && (
              <div className="act-pager">
                <button
                  onClick={() => setActivityPage((p) => Math.max(0, p - 1))}
                  disabled={activityPage === 0}
                  className="act-pager-btn"
                  aria-label={tCommon("previous")}
                >
                  <CaretLeft size={12} weight="bold" />
                </button>
                <span className="act-pager-label">
                  {activityPage + 1}/{totalActivityPages}
                </span>
                <button
                  onClick={() =>
                    setActivityPage((p) =>
                      Math.min(totalActivityPages - 1, p + 1)
                    )
                  }
                  disabled={activityPage >= totalActivityPages - 1}
                  className="act-pager-btn"
                  aria-label={tCommon("next")}
                >
                  <CaretRight size={12} weight="bold" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="act-empty">
            <Lightning
              size={40}
              weight="duotone"
              className="text-text-3"
              aria-hidden="true"
            />
            <p className="text-text-3">{t("noRecentActivity")}</p>
          </div>
        )}
      </section>

      {/* Recommended Courses */}
      <div className="space-y-4">
        <h2 className="font-display text-[24px] font-extrabold">
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
                lessonCount={course.totalLessons}
                xpReward={course.xpReward}
                trackLevel={course.trackLevel}
                pathLabel={course.learningPath ?? undefined}
              />
            ))}
          </div>
        ) : (
          <Card className="shadow-[var(--shadow)] hover:-translate-y-[5px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.25)]">
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
