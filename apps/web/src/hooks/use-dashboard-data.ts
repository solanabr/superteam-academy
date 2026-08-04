"use client";

import { useEffect, useRef, useState } from "react";
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
import {
  pickQuestRewardToasts,
  pickSurpriseBonusToasts,
} from "@/lib/gamification/server-xp-feedback";
import { questPeriodUtc } from "@/lib/gamification/daily-reset";
import { useQuestName } from "@/lib/gamification/use-quest-name";
import { dispatchXpGain } from "@/hooks/use-gamification-events";
import { dispatchSurpriseBonus } from "@/components/gamification/surprise-bonus-toast";
import { dispatchQuestReward } from "@/components/gamification/quest-reward-toast";
import { celebrate } from "@/lib/gamification/celebration";

// Default streak for unauthenticated or on error
const defaultStreak: StreakData = {
  // A true, available zero for the anonymous / initial-load state (distinct from
  // a failed read, which getStreak marks available:false — see #731).
  available: true,
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: "",
  streakHistory: {},
  frozenDays: [],
  freezesRemaining: 0,
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
  const localizedQuestName = useQuestName();
  // The i18n functions cross the RSC boundary via the messages object, whose
  // identity changes on any RSC refresh — keeping them in the effect's deps
  // refired the whole fetch burst every time. Hold them in refs and read
  // `.current` inside the effect so the deps stay [authUserId, authLoading].
  const tDashRef = useRef(tDash);
  tDashRef.current = tDash;
  const localizedQuestNameRef = useRef(localizedQuestName);
  localizedQuestNameRef.current = localizedQuestName;
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
    let active = true;

    async function fetchData() {
      try {
        if (!authUserId) {
          setData((prev) => ({ ...prev, isLoading: false }));
          return;
        }

        const supabase = createClient();

        // TWO concurrent bursts, not a waterfall. Burst A is everything keyed
        // on authUserId alone; burst B is the content-bundle lookups that need
        // burst A's ids. The old shape awaited quests FIRST ("may trigger
        // on-chain XP mints") and then ran the rest in five serial phases —
        // round trips that had no data dependency on each other, which is what
        // made the dashboard feel slow. Since #925 quest awards happen at the
        // ACTION (lesson complete / review / test-out), the dashboard
        // evaluation almost never mints, and when it does the Realtime xp-gain
        // listener corrects the header within a beat — a possibly-one-render-
        // stale balance is the right trade for a fast first paint. The two
        // profiles selects also collapse into one.
        const service = getProgressService(supabase);
        // Activity heatmap window (last 270 days) — computed before the burst
        // so the query can join it.
        const oneYearAgo = new Date();
        oneYearAgo.setDate(oneYearAgo.getDate() - 270);
        const [
          questsResult,
          totalXp,
          streakData,
          profileResult,
          achievementsResult,
          transactionsResult,
          activityRowsResult,
          { data: enrollments },
          { data: progressRows },
          { data: certRows },
          { data: achievementRows },
        ] = await Promise.all([
          fetch("/api/quests/daily")
            .then((res) =>
              res.ok ? res.json() : { quests: [], nextResetTime: "" }
            )
            .catch(() => ({ quests: [], nextResetTime: "" })),
          service.getXP(authUserId),
          service.getStreak(authUserId),
          supabase
            .from("profiles")
            .select("username, name_rerolls_used")
            .eq("id", authUserId)
            .single(),
          supabase
            .from("user_achievements")
            .select("id", { count: "exact", head: true })
            .eq("user_id", authUserId),
          // Bounded: the feed shows a handful of recent items and this set only
          // drives recent-activity lookups — an unbounded fetch grew with every
          // lesson a user ever completed.
          supabase
            .from("xp_transactions")
            .select("amount, reason, created_at, tx_signature, idempotency_key")
            .eq("user_id", authUserId)
            .order("created_at", { ascending: false })
            .limit(100),
          // Activity dates for the streak heatmap (last 270 days)
          supabase
            .from("xp_transactions")
            .select("created_at")
            .eq("user_id", authUserId)
            .gte("created_at", oneYearAgo.toISOString()),
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
        const profile = profileResult.data;
        const rerollData = profileResult.data;
        const achievementsCount = achievementsResult.count;
        const transactions = transactionsResult.data;

        // #790: server-granted XP (daily-quest rewards + surprise bonuses) has
        // no synchronous UI cause. Toast it ONCE from the poll the dashboard
        // already makes — quest rewards from /api/quests/daily's justAwarded,
        // surprise bonuses from the transactions above. Both are deduped
        // session-wide (see server-xp-feedback), so a re-poll never re-toasts,
        // and the surprise-bonus dedupe is shared with the Realtime path.
        //
        // The period is the SERVER's (the route echoes the UTC day its RPC keyed
        // on) — never the browser's local date, which for a São Paulo evening is
        // already the previous UTC day and would key this claim differently from
        // the Realtime channel's, letting one award toast twice.
        const questPeriod =
          typeof questsResult.questPeriod === "string" &&
          questsResult.questPeriod
            ? questsResult.questPeriod
            : questPeriodUtc();
        for (const reward of pickQuestRewardToasts(
          (questsResult.quests ?? []) as DailyQuest[],
          questPeriod,
          authUserId
        )) {
          dispatchXpGain(reward.xpReward);
          // Same celebration the Realtime path fires — one component, one look,
          // wherever the learner happens to be standing.
          dispatchQuestReward({
            questId: reward.questId,
            xpReward: reward.xpReward,
          });
        }
        for (const amount of pickSurpriseBonusToasts(
          transactions ?? [],
          authUserId
        )) {
          dispatchXpGain(amount);
          celebrate("surprise-bonus");
          dispatchSurpriseBonus(amount);
        }

        const activityRows = activityRowsResult.data;

        const streakHistory: Record<string, number> = {};
        for (const row of activityRows ?? []) {
          const dateStr = (row.created_at ?? "").split("T")[0] as string;
          streakHistory[dateStr] = (streakHistory[dateStr] ?? 0) + 1;
        }

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
        const surpriseBonusPattern = /^surprise_bonus:(.+)$/;
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

        const uniqueLessonIds = [...new Set(lessonIdsFromTx)];

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
        // Burst B — every content-bundle lookup that needed burst A's ids,
        // including the lesson titles/slugs (only consumed by the activity-feed
        // loop further down, so it rides along instead of blocking).
        const [
          courseSummaries,
          recommended,
          achievementCatalog,
          lessonOrders,
          lessonSummaries,
        ] = await Promise.all([
          allCourseIdsToFetch.length > 0
            ? getCoursesByIds(allCourseIdsToFetch)
            : Promise.resolve([]),
          getRecommendedCourses(excludeFromRecommended),
          getAllAchievements(),
          allEnrolledIds.length > 0
            ? getCourseLessonOrders(allEnrolledIds)
            : Promise.resolve([]),
          uniqueLessonIds.length > 0
            ? getLessonsByIds(uniqueLessonIds)
            : Promise.resolve([]),
        ]);

        // Build a lookup map: course _id -> Sanity data
        const courseMap = new Map(courseSummaries.map((c) => [c._id, c]));
        const lessonMap = new Map(lessonSummaries.map((l) => [l._id, l]));

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
            // Shared with the Realtime toast's naming (use-quest-name.ts) so
            // the feed and the celebration never spell a quest differently.
            const questName = localizedQuestNameRef.current(questId);
            raw.push({
              type: "xp_other",
              action: tDashRef.current("dailyQuest", { name: questName }),
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
              action: tDashRef.current(i18nKey),
              xp: tx.amount,
              time: tx.created_at ?? new Date().toISOString(),
              txSignature: tx.tx_signature ?? null,
              href: "/community",
            });
          } else if (surpriseBonusPattern.exec(tx.reason)?.[1]) {
            raw.push({
              type: "xp_other",
              action: tDashRef.current("surpriseBonus"),
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

        if (!active) return;
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
        if (!active) return;
        setData((prev) => ({
          ...prev,
          isLoading: false,
          fetchError: true,
        }));
      }
    }

    fetchData();
    // A stale run must not write state over a newer one; in-flight requests are
    // deliberately not aborted (keep it simple) — their results are dropped.
    return () => {
      active = false;
    };
  }, [authUserId, authLoading]);

  return data;
}
