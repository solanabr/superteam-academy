"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Circle, FileText, Code2, HelpCircle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lesson {
  index: number;
  title: string;
  type: "content" | "code_challenge" | "quiz";
  estimatedMinutes?: number;
}

interface CourseSyllabusProps {
  courseId: string;
  lessons: Lesson[];
  completedIndices: number[];
  currentIndex?: number;
}

const TYPE_ICONS = {
  content: FileText,
  code_challenge: Code2,
  quiz: HelpCircle,
};

export function CourseSyllabus({
  courseId,
  lessons,
  completedIndices,
  currentIndex,
}: CourseSyllabusProps) {
  const locale = useLocale();
  const t = useTranslations("courses");

  return (
    <div className="space-y-1">
      <h3 className="font-semibold mb-3">{t("syllabus")}</h3>
      {lessons.map((lesson) => {
        const isCompleted = completedIndices.includes(lesson.index);
        const isCurrent = currentIndex === lesson.index;
        const TypeIcon = TYPE_ICONS[lesson.type] || FileText;

        return (
          <Link
            key={lesson.index}
            href={`/${locale}/courses/${courseId}/lessons/${lesson.index}`}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
              isCurrent && "bg-primary/10 text-primary",
              !isCurrent && isCompleted && "text-muted-foreground hover:bg-accent",
              !isCurrent && !isCompleted && "hover:bg-accent"
            )}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-superteam-green" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <TypeIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate">
              {lesson.index + 1}. {lesson.title}
            </span>
            {lesson.estimatedMinutes && (
              <span className="text-xs text-muted-foreground shrink-0">
                {lesson.estimatedMinutes}m
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
