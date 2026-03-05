"use client";

import { useAuth } from "@/hooks/use-auth";
import { learningProgressService } from "@/services/learning-progress";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Activity, ActivityType } from "@/types/learning";
import { BookOpen, Target, Award, ArrowRight } from "lucide-react";

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  course_started: "activityCourseStarted",
  lesson_started: "activityLessonStarted",
  course_completed: "activityCourseCompleted",
  lesson_completed: "activityLessonCompleted",
  challenge_started: "activityChallengeStarted",
  challenge_completed: "activityChallengeCompleted",
  achievement_claimed: "activityAchievementClaimed",
};

function formatTimeAgo(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffM < 60) return `${diffM} min atrás`;
  if (diffH < 24) return `${diffH}h atrás`;
  return `${diffD}d atrás`;
}

function getActivityHref(a: Activity): string {
  if (a.kind === "course" && a.slug) return `/courses/${a.slug}`;
  if (a.kind === "lesson" && a.slug) {
    const parts = a.slug.split("/");
    const course = parts[0];
    const lesson = parts[parts.length - 1];
    return `/courses/${course}/lessons/${lesson}`;
  }
  if (a.kind === "challenge" && a.slug) return `/challenges/${a.slug}`;
  return "#";
}

export function DashboardClient() {
  const { publicKey } = useAuth();
  const t = useTranslations("dashboard");
  const [xp, setXp] = useState<number | null>(null);
  const [streak, setStreak] = useState<{ current: number } | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const userId = publicKey?.toBase58() ?? "anonymous";
    learningProgressService.getXP(userId).then(setXp);
    learningProgressService.getStreak(userId).then((s) => setStreak(s));
    learningProgressService.getRecentActivities(userId, 10).then(setActivities);
  }, [publicKey]);

  if (!publicKey) return null;
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>{t("recentActivity")}</CardTitle>
        <CardDescription>
          {xp != null && (
            <span className="font-medium text-sky-600">{xp} XP</span>
          )}
          {streak != null && streak.current > 0 && (
            <span className="ml-2">
              · {streak.current} {t("days")} de sequência
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("noActivitiesYet")}
          </p>
        ) : (
          <ul className="space-y-3">
            {activities.map((a) => {
              const href = getActivityHref(a);
              const Icon = a.kind === "challenge" ? Target : BookOpen;
              return (
                <li
                  key={a.id}
                  className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {t(ACTIVITY_LABELS[a.type])}: {a.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatTimeAgo(a.timestamp)}
                      {a.xpGained > 0 && (
                        <span className="ml-2 font-semibold text-sky-600">
                          +{a.xpGained} XP
                        </span>
                      )}
                    </p>
                  </div>
                  {href !== "#" && (
                    <Link
                      href={href}
                      className="shrink-0 text-xs font-medium text-primary hover:underline"
                    >
                      Ver
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {activities.length > 0 && (
          <div className="mt-4 text-center">
            <Link
              href="/activities"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-600 hover:underline"
            >
              {t("viewAll")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
