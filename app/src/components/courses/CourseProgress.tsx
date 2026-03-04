"use client";

import { useTranslations } from "next-intl";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react";
import { useProgressStore } from "@/stores/progress-store";

/** Client-side lesson completion icon — reads from Zustand progress store. */
export function LessonProgressIcon({ courseId, lessonIndex }: { courseId: string; lessonIndex: number }) {
  const t = useTranslations("courses");
  const isLessonComplete = useProgressStore((s) => s.isLessonComplete);
  const complete = isLessonComplete(courseId, lessonIndex);

  return (
    <>
      {complete ? (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-secondary" aria-hidden="true" />
      ) : (
        <Circle className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      )}
      <span className="sr-only">
        {complete ? t("lesson.completed") : t("lesson.notCompleted")}
      </span>
    </>
  );
}

/** Client-side course progress bar — reads from Zustand progress store. */
export function CourseProgressBar({ courseId, totalLessons }: { courseId: string; totalLessons: number }) {
  const t = useTranslations("courses");
  const completedLessons = useProgressStore((s) => s.completedLessons);
  const completedCount = completedLessons[courseId]?.size ?? 0;
  const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  if (progress === 0) return null;

  return (
    <div className="space-y-2" aria-live="polite" aria-atomic="true">
      <div className="flex justify-between text-sm">
        <span>{t("card.progress")}</span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} className="h-2" aria-label={t("lesson.progress")} />
      <p className="text-xs text-muted-foreground">
        {completedCount}/{totalLessons} {t("card.lessons")}
      </p>
    </div>
  );
}
