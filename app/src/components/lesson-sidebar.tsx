"use client";

import Link from "next/link";
import type { Course } from "@/types";
import { useLocale } from "@/contexts/locale-context";
import { useLearning } from "@/contexts/learning-context";
import { CheckCircle, Circle, Code, FileText, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface LessonSidebarProps {
  course: Course;
  currentLessonId: number;
}

const TYPE_ICONS = {
  article: FileText,
  video: Play,
  "code-challenge": Code,
  quiz: FileText,
};

export function LessonSidebar({ course, currentLessonId }: LessonSidebarProps) {
  const { t } = useLocale();
  const { getProgress } = useLearning();
  const progress = getProgress(course.id);
  const completedLessons = progress?.completedLessons ?? [];

  return (
    <aside className="w-full space-y-1">
      <div className="mb-4">
        <Link
          href={`/courses/${course.slug}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; {t("lesson.backToCourse")}
        </Link>
        <h3 className="mt-2 font-semibold text-lg truncate">{course.title}</h3>
        {progress && (
          <p className="text-xs text-muted-foreground mt-1">
            {t("courses.progress", {
              percent: Math.round(progress.percentComplete),
            })}
          </p>
        )}
      </div>

      {course.modules.map((mod) => (
        <div key={mod.id} className="mb-4">
          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground px-2 mb-2">
            {mod.title}
          </h4>
          <div className="space-y-0.5">
            {mod.lessons.map((lesson) => {
              const isCompleted = completedLessons.includes(lesson.id);
              const isCurrent = lesson.id === currentLessonId;
              const Icon = TYPE_ICONS[lesson.type] || FileText;

              return (
                <Link
                  key={lesson.id}
                  href={`/courses/${course.slug}/lessons/${lesson.id}`}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors",
                    isCurrent
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : isCurrent ? (
                    <Circle className="h-4 w-4 shrink-0 text-primary fill-primary/20" />
                  ) : (
                    <Icon className="h-4 w-4 shrink-0" />
                  )}
                  <span className="truncate">{lesson.title}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground/60 shrink-0">
                    {lesson.estimatedMinutes}m
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
}
