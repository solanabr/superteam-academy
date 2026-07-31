"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { BookOpen, CaretRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export interface ThreadContext {
  courseTitle: string;
  courseSlug: string;
  /** Absent when the thread is course-scoped only, or the lesson id no longer
   * resolves in the content bundle (a removed lesson). The chip then links to
   * the course. */
  lessonTitle?: string;
  lessonSlug?: string;
}

interface LessonContextChipProps {
  context: ThreadContext;
  className?: string;
}

/**
 * "Course › Lesson" provenance chip for a thread that was started from a
 * lesson. Links back to the exact lesson so an answer can be read next to the
 * thing it is about; falls back to the course when the lesson does not resolve.
 */
export function LessonContextChip({
  context,
  className,
}: LessonContextChipProps) {
  const locale = useLocale();
  const t = useTranslations("community");
  const { courseTitle, courseSlug, lessonTitle, lessonSlug } = context;

  const href = lessonSlug
    ? `/${locale}/courses/${courseSlug}/lessons/${lessonSlug}`
    : `/${locale}/courses/${courseSlug}`;

  return (
    <Link
      href={href}
      aria-label={`${t("lessonContext")}: ${courseTitle}${
        lessonTitle ? ` — ${lessonTitle}` : ""
      }`}
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-subtle px-2 py-0.5 text-[11px] text-text-3 transition-colors hover:border-primary hover:text-primary",
        className
      )}
    >
      <BookOpen size={11} weight="duotone" aria-hidden="true" />
      <span className="truncate">{courseTitle}</span>
      {lessonTitle && (
        <>
          <CaretRight size={9} weight="bold" aria-hidden="true" />
          <span className="truncate">{lessonTitle}</span>
        </>
      )}
    </Link>
  );
}
