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
import { BookOpen, Target, Award } from "lucide-react";
import { SubpageProfile } from "@/components/subpage-profile";

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
  if (diffM < 60) return `${diffM}min`;
  if (diffH < 24) return `${diffH}h`;
  return `${diffD}d`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("default", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
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

function getActivityIcon(a: Activity) {
  if (a.type.includes("completed")) return Award;
  if (a.kind === "challenge") return Target;
  return BookOpen;
}

export default function ActivitiesPage() {
  const { publicKey } = useAuth();
  const t = useTranslations("dashboard");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = publicKey?.toBase58() ?? "anonymous";
    learningProgressService.getRecentActivities(userId, 100).then((acts) => {
      setActivities(acts);
      setLoading(false);
    });
  }, [publicKey]);

  return (
    <div className="container py-8">
      <SubpageProfile />

      {loading ? (
        <div className="py-16 text-center">
          <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-muted border-t-[hsl(var(--brand-logo-green))]" />
        </div>
      ) : activities.length === 0 ? (
        <div className="py-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">{t("noActivitiesYet")}</p>
        </div>
      ) : (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>{t("recentActivity")}</CardTitle>
            <CardDescription>
              {activities.length}{" "}
              {activities.length === 1 ? "atividade" : "atividades"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {activities.map((a) => {
                const href = getActivityHref(a);
                const Icon = getActivityIcon(a);
                const isCompleted = a.type.includes("completed");
                return (
                  <li
                    key={a.id}
                    className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isCompleted ? "bg-[hsl(var(--brand-logo-green))]/20" : "bg-primary/20"}`}
                    >
                      <Icon
                        className={`h-4 w-4 ${isCompleted ? "text-[hsl(var(--brand-logo-green))]" : "text-primary"}`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {t(ACTIVITY_LABELS[a.type])}: {a.label}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDate(a.timestamp)}</span>
                        <span>({formatTimeAgo(a.timestamp)})</span>
                        {a.xpGained > 0 && (
                          <span className="font-semibold text-sky-600">
                            +{a.xpGained} XP
                          </span>
                        )}
                      </div>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
