import "server-only";
import { cache } from "react";
import { after } from "next/server";
import { getTranslations } from "next-intl/server";
import type {
  CohortLeague,
  DailyQuest,
  StreakData,
} from "@superteam-lms/types";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProgressService } from "@/lib/services";
import { calculateLevel } from "@/lib/gamification/xp";
import {
  getAllAchievements,
  getAllQuests,
  getCourseLessonOrders,
  getCoursesByIds,
  getLessonsByIds,
  getRecommendedCourses,
} from "@/lib/content/queries";
import { deriveContinueTarget } from "@/lib/courses/continue-learning";
import { questDisplayName } from "@/lib/gamification/quest-name";
import { isSurpriseBonusReason } from "@/lib/gamification/surprise-bonus";
import {
  nextMidnightUtc,
  questPeriodUtc,
} from "@/lib/gamification/daily-reset";
import {
  evaluateQuests,
  type QuestProgressRow,
} from "@/lib/gamification/quest-evaluation";
import { retryQuestXpForUser } from "@/lib/gamification/xp-queue-settlement";
import { getCohortLeaderboard } from "@/lib/leaderboard/cohort";
import { deriveCohortStrip } from "@/lib/leaderboard/cohort-window";
import { buildReviewSession } from "@/lib/review/session";
import { serverEnv } from "@/lib/env.server";
import type { ActivityItem, CurrentCourse, DashboardCoreData } from "./types";

/**
 * Server-side dashboard loaders (#1096). These replace the old
 * `useDashboardData` client hook's ~19 post-hydration HTTP requests with
 * direct reads: the per-user Supabase burst runs on the cookie-bound server
 * client (same RLS semantics as the browser client), and every content-bundle
 * lookup is a direct `@/lib/content/queries` import — a synchronous in-memory
 * read instead of an `/api/content/*` round trip.
 *
 * `loadDashboardCore` is wrapped in React `cache()` so the hero Continue card
 * and the main column (separate Suspense boundaries) share ONE run per render.
 */

// Reason-string parsers, shared with the old hook's activity assembly.
const lessonPattern = /^Completed lesson:\s*(.+)$/;
const challengePattern = /^Completed challenge:\s*(.+)$/;
const courseCompletePattern = /^Completed course:\s*(.+)$/;
const achievementRewardPattern = /^Achievement reward:\s*(.+)$/;
const courseCompletionBonusPattern = /^Course completion bonus:\s*(.+)$/;
const dailyQuestPattern = /^daily_quest:(.+)$/;
const communityPattern = /^community:(.+)$/;
const surpriseBonusPattern = /^surprise_bonus:(.+)$/;

function titleCaseAchievementId(rawId: string): string {
  return rawId
    .replace(/^achievement-/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase());
}

export const loadDashboardCore = cache(
  async (userId: string): Promise<DashboardCoreData> => {
    const [supabase, tDash, tGam] = await Promise.all([
      createClient(),
      getTranslations("dashboard"),
      getTranslations("gamification"),
    ]);
    const localizedQuestName = (questId: string): string => {
      const key = `questNames.${questId}`;
      return tGam.has(key) ? tGam(key) : questDisplayName(questId);
    };

    const service = getProgressService(supabase);
    // Activity heatmap window (last 270 days) — computed before the burst so
    // the query can join it.
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 270);

    // Burst A — everything keyed on the user id alone, in one Promise.all.
    const [
      totalXp,
      streakData,
      achievementsResult,
      transactionsResult,
      activityRowsResult,
      { data: enrollments },
      { data: progressRows },
      { data: certRows },
      { data: achievementRows },
    ] = await Promise.all([
      service.getXP(userId),
      service.getStreak(userId),
      supabase
        .from("user_achievements")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      // Bounded: the feed shows a handful of recent items and this set only
      // drives recent-activity lookups — an unbounded fetch grew with every
      // lesson a user ever completed.
      supabase
        .from("xp_transactions")
        .select("amount, reason, created_at, tx_signature, idempotency_key")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100),
      // Activity dates for the streak heatmap (last 270 days)
      supabase
        .from("xp_transactions")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", oneYearAgo.toISOString()),
      supabase
        .from("enrollments")
        .select("course_id, enrolled_at, tx_signature")
        .eq("user_id", userId),
      supabase
        .from("user_progress")
        .select("course_id, lesson_id, completed, completed_at")
        .eq("user_id", userId)
        .eq("completed", true),
      supabase
        .from("certificates")
        .select("course_id, course_title, minted_at, tx_signature")
        .eq("user_id", userId),
      supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at, tx_signature")
        .eq("user_id", userId)
        .order("unlocked_at", { ascending: false })
        .limit(10),
    ]);
    const achievementsCount = achievementsResult.count;
    const transactions = transactionsResult.data;
    const activityRows = activityRowsResult.data;

    const streakHistory: Record<string, number> = {};
    for (const row of activityRows ?? []) {
      const dateStr = (row.created_at ?? "").split("T")[0] as string;
      streakHistory[dateStr] = (streakHistory[dateStr] ?? 0) + 1;
    }

    // Courses with minted certificates should not appear in "Current Courses"
    const mintedCourseIds = new Set((certRows ?? []).map((c) => c.course_id));

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

    // Resolve enrolled course titles and lesson counts from the content bundle.
    // Exclude courses that already have a minted certificate.
    const allEnrolledIds = enrollments?.map((e) => e.course_id) ?? [];
    const enrolledIds = allEnrolledIds.filter((id) => !mintedCourseIds.has(id));
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

    // Burst B — content-bundle lookups keyed on burst A's ids. Direct imports:
    // in-memory bundle reads, no /api/content/* HTTP hop (#1096).
    const [
      courseSummaries,
      recommended,
      achievementCatalog,
      lessonOrders,
      lessonSummaries,
    ] = await Promise.all([
      getCoursesByIds(allCourseIdsToFetch),
      getRecommendedCourses(excludeFromRecommended),
      getAllAchievements(),
      getCourseLessonOrders(allEnrolledIds),
      getLessonsByIds(uniqueLessonIds),
    ]);

    const courseMap = new Map(courseSummaries.map((c) => [c._id, c]));
    const lessonMap = new Map(lessonSummaries.map((l) => [l._id, l]));

    // Only surface enrolled courses that still resolve from the content bundle.
    // A deactivated (or unpublished) course is filtered out by getCoursesByIds
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

    // Derive the hero Continue card target: next incomplete lesson in the most
    // recently active enrolled course (LX-B2). Minted (certified) courses still
    // count as enrolled-and-finished for the all-complete state but are never a
    // continue candidate.
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
    const raw: ActivityItem[] = [];

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
          action: lesson ? `Completed challenge: ${lesson.title}` : tx.reason,
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
        raw.push({
          type: "xp_other",
          action: `Achievement reward: ${titleCaseAchievementId(rawId)}`,
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
        // Shared with the Realtime toast's naming (quest-name.ts) so the feed
        // and the celebration never spell a quest differently.
        raw.push({
          type: "xp_other",
          action: tDash("dailyQuest", { name: localizedQuestName(questId) }),
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
      } else if (surpriseBonusPattern.exec(tx.reason)?.[1]) {
        raw.push({
          type: "xp_other",
          action: tDash("surpriseBonus"),
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
      raw.push({
        type: "achievement",
        action: `Achievement unlocked: ${titleCaseAchievementId(row.achievement_id)}`,
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
        action: course ? `Enrolled in ${course.title}` : `Enrolled in course`,
        xp: 0,
        time: enrollment.enrolled_at,
        txSignature: enrollment.tx_signature ?? null,
        href: course ? `/courses/${course.slug}` : null,
      });
    }

    raw.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return {
      xp: totalXp,
      level: calculateLevel(totalXp),
      streak,
      achievementsCount: achievementsCount ?? 0,
      unlockedAchievementIds: (achievementRows ?? []).map(
        (r) => r.achievement_id
      ),
      achievementCatalog,
      currentCourses,
      continueTarget,
      recommendedCourses: recommended,
      recentActivity: raw,
      // Only the surprise-bonus candidates cross to the client celebration
      // island — the browser holds the sessionStorage dedupe, not the server.
      surpriseBonusRows: (transactions ?? []).filter(
        (tx) => tx.reason != null && isSurpriseBonusReason(tx.reason)
      ),
    };
  }
);

export interface DashboardQuestState {
  quests: DailyQuest[];
  nextResetTime: string;
  /** The SERVER's UTC quest period — the toast dedupe key (#790). */
  questPeriod: string;
}

/**
 * Server-side port of GET /api/quests/daily (same evaluator, same sweep) so
 * the dashboard render carries the quest state instead of a client fetch.
 * Failure semantics match the old client path: any error degrades to an empty
 * quest list, never a broken dashboard.
 */
export async function loadDashboardQuests(
  userId: string
): Promise<DashboardQuestState> {
  const empty: DashboardQuestState = {
    quests: [],
    nextResetTime: nextMidnightUtc(),
    questPeriod: questPeriodUtc(),
  };
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !serverEnv.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return empty;
  }

  try {
    const questData = await getAllQuests();
    if (questData.quests.length === 0) return empty;

    // Evaluate + award through the SHARED implementation
    // (lib/gamification/quest-evaluation) — byte-identical to what the
    // lesson-complete / review-grade / test-out paths run, so the panel and
    // the action paths can never drift apart. The RPC's own xp_granted guard
    // makes the overlap safe.
    const admin = createAdminClient();
    const progressRows: QuestProgressRow[] = await evaluateQuests(
      admin,
      userId
    );

    const progressMap = new Map(progressRows.map((row) => [row.questId, row]));
    const quests: DailyQuest[] = questData.quests.map((q) => {
      const progress = progressMap.get(q.id);
      return {
        id: q.id,
        type: q.type,
        name: q.name,
        description: q.description,
        icon: q.icon,
        xpReward: q.xpReward,
        targetValue: q.targetValue,
        currentValue: progress?.currentValue ?? 0,
        completed: progress?.completed ?? false,
        resetType: q.resetType,
        justAwarded: progress?.justAwarded ?? false,
      };
    });

    // Deliver this user's pending quest_xp credits off the render path — the
    // sweep is idempotent and durable, exactly as the API route ran it.
    after(async () => {
      try {
        await retryQuestXpForUser(admin, userId);
      } catch (err) {
        console.error("[dashboard/loaders] quest_xp sweep failed:", err);
      }
    });

    return {
      quests,
      nextResetTime: nextMidnightUtc(),
      questPeriod: questPeriodUtc(),
    };
  } catch (err) {
    console.error(
      "[dashboard/loaders] quest load failed:",
      err instanceof Error ? err.message : String(err)
    );
    return empty;
  }
}

/**
 * The due-review summary — the same capped `buildReviewSession` the /review
 * page and /api/review/due run (#977), called directly instead of over HTTP.
 */
export async function loadReviewDue(
  userId: string
): Promise<{ count: number; titles: string[] }> {
  try {
    const supabase = await createClient();
    const session = await buildReviewSession(supabase, userId);
    return {
      count: session.length,
      titles: session.map((item) => item.lessonTitle),
    };
  } catch {
    // Non-critical dashboard surface — the strip stays hidden on failure.
    return { count: 0, titles: [] };
  }
}

/**
 * The "you ±3" weekly cohort strip (LX-B9b) — the server-side twin of
 * GET /api/leaderboard/cohort?window=strip.
 */
export async function loadCohortStrip(
  userId: string
): Promise<CohortLeague | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !serverEnv.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return null;
  }
  try {
    const admin = createAdminClient();
    const league = await getCohortLeaderboard(admin, userId);
    if (!league) return null;
    return { ...league, entries: deriveCohortStrip(league.entries) };
  } catch {
    // Non-critical dashboard surface — stay hidden on failure.
    return null;
  }
}
