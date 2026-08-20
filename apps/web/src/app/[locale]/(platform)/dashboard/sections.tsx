import { getLocale } from "next-intl/server";
import {
  loadCohortStrip,
  loadDashboardCore,
  loadDashboardQuests,
  loadReviewDue,
} from "@/lib/dashboard/loaders";
import { DashboardIdentityPanel } from "@/components/gamification/dashboard-identity-panel";
import { AchievementsStrip } from "@/components/dashboard/achievements-strip";
import { ActivitySection } from "@/components/dashboard/activity-section";
import {
  ContinueCard,
  type ContinueCardTarget,
} from "@/components/dashboard/continue-card";
import { CohortStrip } from "@/components/dashboard/cohort-strip";
import { CurrentCoursesSection } from "@/components/dashboard/current-courses-section";
import { DailyQuestsCard } from "@/components/dashboard/daily-quests-card";
import {
  QuestRewardCelebrations,
  SurpriseBonusCelebrations,
} from "@/components/dashboard/dashboard-celebrations";
import { DashboardFetchError } from "@/components/dashboard/dashboard-fetch-error";
import { ReviewStrip } from "@/components/dashboard/review-strip";
import type { DashboardCoreData } from "@/lib/dashboard/types";

/**
 * Async server sections streamed behind the dashboard's Suspense boundaries
 * (#1096). `loadDashboardCore` is React-`cache()`d, so the hero and the main
 * column — separate boundaries for layout reasons — share ONE data pass.
 */

interface SectionProps {
  userId: string;
}

/** Map the derived continue target onto the hero card's shape. All-complete
 * learners are pointed at the next (recommended) course, or the catalog when
 * nothing is left to recommend. No enrollments → no card (the Current
 * Courses empty state keeps its catalog CTA). */
function continueCardTarget(
  data: DashboardCoreData
): ContinueCardTarget | null {
  const target = data.continueTarget;
  if (!target) return null;
  if (target.kind === "lesson") {
    return {
      kind: "lesson",
      courseTitle: target.courseTitle,
      courseSlug: target.courseSlug,
      lessonTitle: target.lesson.title,
      lessonSlug: target.lesson.slug,
      completedLessons: target.completedLessons,
      totalLessons: target.totalLessons,
    };
  }
  const next = data.recommendedCourses[0];
  return next
    ? { kind: "nextCourse", courseTitle: next.title, courseSlug: next.slug }
    : { kind: "catalog" };
}

/** Hero Continue card — deep link to the next incomplete lesson (LX-B2). */
export async function ContinueHeroSection({ userId }: SectionProps) {
  let data: DashboardCoreData;
  try {
    data = await loadDashboardCore(userId);
  } catch {
    // The main column renders the one error card; the hero just stays away.
    return null;
  }
  const target = continueCardTarget(data);
  if (!target) return null;
  const locale = await getLocale();
  return <ContinueCard target={target} locale={locale} />;
}

/** Identity panel, achievements, current courses, and the activity feed. */
export async function MainColumnSection({ userId }: SectionProps) {
  let data: DashboardCoreData;
  try {
    data = await loadDashboardCore(userId);
  } catch (err: unknown) {
    console.error(
      "[Dashboard] Data fetch failed:",
      err instanceof Error ? err.message : "Unknown error"
    );
    return <DashboardFetchError />;
  }

  return (
    <>
      {/* Identity panel — Level+XP | learning-activity heatmap, one band. */}
      <DashboardIdentityPanel
        xp={data.xp}
        level={data.level}
        streak={data.streak}
      />

      {/* Achievements — earned + the next couple of goals; count links to
          the full set on the profile. */}
      <AchievementsStrip
        achievementsCount={data.achievementsCount}
        unlockedAchievementIds={data.unlockedAchievementIds}
        catalog={data.achievementCatalog}
      />

      {/* ═══ Current Courses ═══ */}
      <CurrentCoursesSection
        currentCourses={data.currentCourses}
        userId={userId}
      />

      {/* ═══ Activity ═══ */}
      <ActivitySection recentActivity={data.recentActivity} />

      {/* #790 poll-path surprise-bonus toasts — client island, renders nothing. */}
      <SurpriseBonusCelebrations
        rows={data.surpriseBonusRows}
        userId={userId}
      />
    </>
  );
}

/** Due-review strip (LX-B6); renders nothing when the queue is empty. */
export async function ReviewStripSection({ userId }: SectionProps) {
  const { count, titles } = await loadReviewDue(userId);
  return <ReviewStrip count={count} titles={titles} />;
}

/** Daily quests rail card + the one-shot quest-reward toasts (#790). */
export async function QuestsSection({ userId }: SectionProps) {
  const { quests, nextResetTime, questPeriod } =
    await loadDashboardQuests(userId);
  return (
    <>
      <DailyQuestsCard quests={quests} questsResetTime={nextResetTime} />
      <QuestRewardCelebrations
        quests={quests}
        questPeriod={questPeriod}
        userId={userId}
      />
    </>
  );
}

/** Cohort league "you ±3" (LX-B9b) — quiet solo state while filling. */
export async function CohortStripSection({ userId }: SectionProps) {
  const league = await loadCohortStrip(userId);
  return <CohortStrip league={league} />;
}
