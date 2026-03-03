"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { LessonNavItem } from "@/types";

export interface LessonNavigationProps {
  courseSlug: string;
  prevLesson: LessonNavItem | null;
  nextLesson: LessonNavItem | null;
  children?: React.ReactNode;
  compact?: boolean;
}

export function LessonNavigation({
  courseSlug,
  prevLesson,
  nextLesson,
  children,
  compact,
}: LessonNavigationProps) {
  const t = useTranslations("lesson");
  return (
    <div className="border-t border-border bg-card px-4 py-3 sm:px-6">
      <div
        className={cn(
          "flex items-center justify-between",
          !compact && "mx-auto max-w-3xl",
        )}
      >
        <div>
          {prevLesson ? (
            <Link
              href={`/courses/${courseSlug}/lessons/${prevLesson.lesson.id}`}
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              {compact ? (
                t("previous")
              ) : (
                <>
                  <span className="hidden max-w-[180px] truncate sm:inline">
                    {prevLesson.lesson.title}
                  </span>
                  <span className="sm:hidden">{t("previous")}</span>
                </>
              )}
            </Link>
          ) : (
            <div />
          )}
        </div>

        {children}

        <div>
          {nextLesson ? (
            <Link
              href={`/courses/${courseSlug}/lessons/${nextLesson.lesson.id}`}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                compact
                  ? "text-muted-foreground hover:text-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              {compact ? (
                t("next")
              ) : (
                <>
                  <span className="hidden max-w-[180px] truncate sm:inline">
                    {nextLesson.lesson.title}
                  </span>
                  <span className="sm:hidden">{t("next")}</span>
                </>
              )}
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : !compact ? (
            <Link
              href={`/courses/${courseSlug}`}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("backToCourse")}
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
