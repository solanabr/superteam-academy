"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface LessonNavProps {
  courseId: string;
  courseTitle: string;
  lessons: { index: number; title: string }[];
  currentIndex: number;
  completedIndices: number[];
}

export function LessonNav({
  courseId,
  courseTitle,
  lessons,
  currentIndex,
  completedIndices,
}: LessonNavProps) {
  const locale = useLocale();
  const progress = Math.round((completedIndices.length / lessons.length) * 100);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/${locale}/courses/${courseId}`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {courseTitle}
        </Link>
        <div className="flex items-center gap-2 mt-2">
          <Progress value={progress} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground">
            {completedIndices.length}/{lessons.length}
          </span>
        </div>
      </div>

      <div className="space-y-0.5 max-h-[60vh] overflow-y-auto">
        {lessons.map((lesson) => {
          const isCompleted = completedIndices.includes(lesson.index);
          const isCurrent = currentIndex === lesson.index;

          return (
            <Link
              key={lesson.index}
              href={`/${locale}/courses/${courseId}/lessons/${lesson.index}`}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors",
                isCurrent && "bg-primary/10 text-primary font-medium",
                !isCurrent && "hover:bg-accent text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-superteam-green" />
              ) : (
                <Circle className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="truncate">
                {lesson.index + 1}. {lesson.title}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
