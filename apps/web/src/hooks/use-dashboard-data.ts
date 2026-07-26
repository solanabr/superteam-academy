"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { StreakData, DailyQuest } from "@superteam-lms/types";
import { createClient } from "@/lib/supabase/client";
import { getProgressService } from "@/lib/services";
import { calculateLevel } from "@/lib/gamification/xp";
import {
  getCourseLessonOrders,
  getCoursesByIds,
  getLessonsByIds,
  getRecommendedCourses,
  getAllAchievements,
} from "@/lib/content/client-queries";
import type {
  RecommendedCourse,
  DeployedAchievement,
} from "@/lib/content/queries";
import {
  deriveContinueTarget,
  type ContinueTarget,
} from "@/lib/courses/continue-learning";

// Default streak for unauthenticated or on error
const defaultStreak: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: "",
  streakHistory: {},
};

export interface CurrentCourse {
  courseId: string;
  title: string;
  slug: string;
  completedLessons: number;
  totalLessons: number;
  difficulty: string;
  learningPath: string | null;
  thumbnail: string | null;
}

export interface ActivityItem {
  type:
    | "lesson"
    | "challenge"
    | "course_complete"
    | "achievement"
    | "certificate"
    | "enrollment"
    | "community"
    | "xp_other";
  action: string;
  xp: number;
  time: string;
  href: string | null;
  txSignature: string | null;
}

export interface DashboardData {
  xp: number;
  level: number;
  streak: StreakData;
  achievementsCount: number;
  /** Full Sanity _ids of achievements unlocked by this user */
  unlockedAchievementIds: string[];
  /** All achievements from the content bundle — single source of truth for catalog */
  achievementCatalog: DeployedAchievement[];
  quests: DailyQuest[];
  questsResetTime: string;
  currentCourses: CurrentCourse[];
  /** Next-incomplete-lesson derivation for the hero Continue card (LX-B2). */
  continueTarget: ContinueTarget | null;
  recommendedCourses: RecommendedCourse[];
  recentActivity: ActivityItem[];
  username: string;
  userId: string;
  nameRerollsUsed: number;
  isLoading: boolean;
  fetchError: boolean;
}

export function useDashboardData(
  authUserId: string | null,
  authLoading: boolean
): DashboardData {
  const tDash = useTranslations("dashboard");
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
    continueTarget: null,
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

        // Fetch recent XP transactions for the activity feed + recent-course
        // resolution. Bounded: the feed shows a handful of recent items and this
        // set only drives recent-activity lookups — an unbounded fetch grew with
        // every lesson a user ever completed.
        const { data: transactions } = await supabase
          .from("xp_transactions")
          .select("amount, reason, created_at, tx_signature")
          .eq("user_id", authUserId)
          .order("created_at", { ascending: false })
          .limit(100);

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
            .select("course_id, lesson_id, completed, completed_at")
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
        const communityPattern = /^community:(.+)$/;
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

        // Fetch lesson titles/slugs from the content bundle
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

        // Resolve enrolled course titles and lesson counts from the content bundle
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
        const [courseSummaries, recommended, achievementCatalog, lessonOrders] =
          await Promise.all([
            allCourseIdsToFetch.length > 0
              ? getCoursesByIds(allCourseIdsToFetch)
              : Promise.resolve([]),
            getRecommendedCourses(excludeFromRecommended),
            getAllAchievements(),
            allEnrolledIds.length > 0
              ? getCourseLessonOrders(allEnrolledIds)
              : Promise.resolve([]),
          ]);
        // Build a lookup map: course _id -> Sanity data
        const courseMap = new Map(courseSummaries.map((c) => [c._id, c]));

        // Only surface enrolled courses that still resolve from the content bundle. A
        // deactivated (or unpublished) course is filtered out by getCoursesByIds
        // (activeGate), so without this its "Continue learning" card would still
        // render from the Supabase enrollment row with a raw-id title.
        const currentCourses: CurrentCourse[] = enrolledIds
          .filter((id) => courseMap.has(id))
          .map((id) => {
            const courseInfo = courseMap.get(id);
            return {
              courseId: id,
              title: courseInfo?.title ?? id,
              slug: courseInfo?.slug ?? id,
              completedLessons: completedPerCourse.get(id) ?? 0,
              totalLessons: courseInfo?.totalLessons ?? 0,
              difficulty: courseInfo?.difficulty ?? "beginner",
              learningPath: courseInfo?.learningPath ?? null,
              thumbnail: courseInfo?.thumbnail ?? null,
            };
          });

        // Derive the hero Continue card target: next incomplete lesson in the
        // most recently active enrolled course (LX-B2). Minted (certified)
        // courses still count as enrolled-and-finished for the all-complete
        // state but are never a continue candidate.
        const lessonOrderById = new Map(
          lessonOrders.map((o) => [o._id, o.lessons])
        );
        const enrolledAtById = new Map(
          (enrollments ?? []).map((e) => [e.course_id, e.enrolled_at])
        );
        const continueTarget = deriveContinueTarget(
          allEnrolledIds
            .filter((id) => courseMap.has(id))
            .map((id) => {
              const info = courseMap.get(id)!;
              return {
                courseId: id,
                title: info.title,
                slug: info.slug,
                enrolledAt: enrolledAtById.get(id) ?? null,
                certified: mintedCourseIds.has(id),
                lessons: lessonOrderById.get(id) ?? [],
              };
            }),
          (progressRows ?? []).map((row) => ({
            courseId: row.course_id,
            lessonId: row.lesson_id,
            completedAt: row.completed_at,
          }))
        );

        // Build multi-source activity feed. Each source uses a different timestamp
        // column name; normalise all to `time` before merging and sorting.
        type ActivityType =
          | "lesson"
          | "challenge"
          | "course_complete"
          | "achievement"
          | "certificate"
          | "enrollment"
          | "community"
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
              action: tDash("dailyQuest", { name: questName }),
              xp: tx.amount,
              time: tx.created_at ?? new Date().toISOString(),
              txSignature: tx.tx_signature ?? null,
              href: null,
            });
          } else if (communityPattern.exec(tx.reason)?.[1]) {
            const suffix = tx.reason.match(communityPattern)![1]!;
            const i18nKey = `communityActivity_${suffix}` as const;
            raw.push({
              type: "community",
              action: tDash(i18nKey),
              xp: tx.amount,
              time: tx.created_at ?? new Date().toISOString(),
              txSignature: tx.tx_signature ?? null,
              href: "/community",
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
          continueTarget,
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
  }, [authUserId, authLoading, tDash]);

  return data;
}
