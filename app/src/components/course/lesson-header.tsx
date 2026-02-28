"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, Code, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { ComboIndicator } from "@/components/gamification/combo-indicator";
import type { Course, Lesson } from "@/types";

export interface LessonHeaderProps {
  course: Course;
  lesson: Lesson;
  moduleTitle: string;
  moduleIndex: number;
  currentIndex: number;
  totalLessons: number;
}

export function LessonHeader({
  course,
  lesson,
  moduleTitle,
  moduleIndex,
  currentIndex,
  totalLessons,
}: LessonHeaderProps) {
  const t = useTranslations("lesson");
  return (
    <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
      <div className="flex items-center gap-3">
        <Link
          href={`/courses/${course.slug}`}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{course.title}</span>
        </Link>

        <div className="hidden h-4 w-px bg-border sm:block" />

        <div className="hidden items-center gap-1.5 text-sm sm:flex">
          <span className="text-muted-foreground">
            {t("moduleLabel", { index: moduleIndex + 1, title: moduleTitle })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {lesson.type === "challenge" ? (
            <Code className="h-3.5 w-3.5 text-brazil-gold" />
          ) : (
            <BookOpen className="h-3.5 w-3.5 text-brazil-teal" />
          )}
          <span>
            {currentIndex + 1} / {totalLessons}
          </span>
        </div>

        <ComboIndicator />

        <div className="flex items-center gap-1 text-xs font-medium text-xp">
          <Trophy className="h-3.5 w-3.5" />
          {lesson.xpReward} XP
        </div>
      </div>
    </div>
  );
}
