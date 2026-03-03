"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  BookOpen,
  GraduationCap,
  UserPlus,
  Trophy,
  Flame,
  Clock,
} from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";
import { useLearningProgress } from "@/lib/hooks/use-learning-progress";
import {
  getRecentActivities,
  type ActivityEntry,
  type ActivityType,
} from "@/lib/services/activity-log";

const ICON_MAP: Record<ActivityType, typeof BookOpen> = {
  lesson_completed: BookOpen,
  course_completed: GraduationCap,
  course_enrolled: UserPlus,
  achievement_earned: Trophy,
  streak_milestone: Flame,
};

const COLOR_MAP: Record<ActivityType, string> = {
  lesson_completed: "bg-st-green/10 text-st-green",
  course_completed: "bg-brazil-gold/10 text-brazil-gold",
  course_enrolled: "bg-brazil-teal/10 text-brazil-teal",
  achievement_earned: "bg-achievement/10 text-achievement",
  streak_milestone: "bg-streak/10 text-streak",
};

function getActivityMessage(
  entry: ActivityEntry,
  t: ReturnType<typeof useTranslations>,
): string {
  switch (entry.type) {
    case "lesson_completed":
      return t("activityLessonCompleted", {
        lesson: entry.meta.lesson ?? "",
        course: entry.meta.course ?? "",
      });
    case "course_completed":
      return t("activityCourseCompleted", { course: entry.meta.course ?? "" });
    case "course_enrolled":
      return t("activityCourseEnrolled", { course: entry.meta.course ?? "" });
    case "achievement_earned":
      return t("activityAchievementEarned", {
        achievement: entry.meta.achievement ?? "",
      });
    case "streak_milestone":
      return t("activityStreakMilestone", { days: entry.meta.days ?? "0" });
    default:
      return "";
  }
}

function getActivityLink(entry: ActivityEntry): string | null {
  switch (entry.type) {
    case "lesson_completed":
    case "course_completed":
    case "course_enrolled":
      return entry.meta.courseSlug ? `/courses/${entry.meta.courseSlug}` : null;
    case "achievement_earned":
      return "/profile";
    default:
      return null;
  }
}

interface ActivityFeedProps {
  limit?: number;
}

export function ActivityFeed({ limit = 8 }: ActivityFeedProps) {
  const t = useTranslations("dashboard");
  const { userId, isLoaded } = useLearningProgress();

  const activities = useMemo(
    () => (isLoaded ? getRecentActivities(userId, limit) : []),
    [userId, isLoaded, limit],
  );

  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-xl font-bold">{t("recentActivity")}</h2>
      </div>

      {activities.length === 0 ? (
        <div className="glass rounded-xl p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("noActivity")}</p>
        </div>
      ) : (
        <div className="glass rounded-xl divide-y divide-border">
          {activities.map((entry) => {
            const Icon = ICON_MAP[entry.type];
            const colorClass = COLOR_MAP[entry.type];
            const link = getActivityLink(entry);
            const message = getActivityMessage(entry, t);

            const content = (
              <div className="flex items-start gap-3 p-3">
                <div
                  className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${colorClass}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">{message}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatRelativeDate(entry.timestamp)}
                  </p>
                </div>
              </div>
            );

            return link ? (
              <Link
                key={entry.id}
                href={link}
                className="block transition-colors hover:bg-muted/50 first:rounded-t-xl last:rounded-b-xl"
              >
                {content}
              </Link>
            ) : (
              <div key={entry.id}>{content}</div>
            );
          })}
        </div>
      )}
    </section>
  );
}
