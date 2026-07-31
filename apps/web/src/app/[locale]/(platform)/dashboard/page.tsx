"use client";

import { useTranslations, useLocale } from "next-intl";
import { WarningOctagon } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth/auth-provider";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardIdentityPanel } from "@/components/gamification/dashboard-identity-panel";
import { ActivitySection } from "@/components/dashboard/activity-section";
import {
  ContinueCard,
  type ContinueCardTarget,
} from "@/components/dashboard/continue-card";
import { CurrentCoursesSection } from "@/components/dashboard/current-courses-section";
import { ReviewStrip } from "@/components/dashboard/review-strip";
import { CohortStrip } from "@/components/dashboard/cohort-strip";
import { NameRevealDialog } from "@/components/dashboard/name-reveal-dialog";
import { NextLessonPlan } from "@/components/dashboard/next-lesson-plan";

/**
 * Dashboard composition root (LX-B1). Data flows from `useDashboardData`;
 * each surface below is an independent slot component under
 * `components/dashboard/` so future surfaces land additively instead of
 * contending for this file.
 */
export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { userId: authUserId, isLoading: authLoading } = useAuth();
  const data = useDashboardData(authUserId, authLoading);

  // Map the derived continue target onto the hero card's shape. All-complete
  // learners are pointed at the next (recommended) course, or the catalog when
  // nothing is left to recommend. No enrollments → no card (the Current
  // Courses empty state keeps its catalog CTA).
  const continueCardTarget: ContinueCardTarget | null = (() => {
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
  })();

  if (data.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="sol-spinner" />
        <span className="sr-only">{tCommon("loading")}</span>
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
      <h1 className="font-display text-2xl font-black tracking-[-0.5px] sm:text-3xl">
        {t("title")}
      </h1>

      {/* Hero Continue card — deep link to the next incomplete lesson (LX-B2) */}
      {continueCardTarget && (
        <ContinueCard target={continueCardTarget} locale={locale} />
      )}

      {/* Due-review strip — additive hero slot under Continue (LX-B6); renders
          nothing when the review queue is empty. */}
      <ReviewStrip userId={data.userId} />

      {/* Cohort league "you ±3" strip — additive slot (LX-B9b); renders nothing
          until the viewer has a weekly cohort with at least one neighbor. */}
      <CohortStrip userId={data.userId} />

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

      {/* Session-end if-then plan — "when's your next lesson?" (LX-A6). A
          return-cadence surface, so it sits beside the streak/quest identity
          panel. Display-only in v1: stored in profiles.prefs, shown on return. */}
      <NextLessonPlan userId={data.userId} />

      {/* ═══ Current Courses ═══ */}
      <CurrentCoursesSection
        currentCourses={data.currentCourses}
        userId={data.userId}
      />

      {/* ═══ Activity ═══ */}
      <ActivitySection recentActivity={data.recentActivity} />

      {/* Name reveal modal — shown on first login */}
      <NameRevealDialog
        isLoading={data.isLoading}
        userId={data.userId}
        username={data.username}
        nameRerollsUsed={data.nameRerollsUsed}
      />
    </div>
  );
}
