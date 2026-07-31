"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface ThreadFiltersProps {
  sort: string;
  onSortChange: (sort: string) => void;
  type: string | undefined;
  onTypeChange: (type: string | undefined) => void;
  showTypeFilter?: boolean;
  /**
   * "Course questions" — threads that carry a course scope. A separate axis
   * from the type pills (a course question is still a question), so it toggles
   * independently rather than joining TYPE_OPTIONS.
   */
  courseOnly?: boolean;
  onCourseOnlyChange?: (courseOnly: boolean) => void;
  showCourseFilter?: boolean;
  /**
   * Primary action (e.g. "Ask a question") pinned to the right of this SAME
   * row. In a lesson embed a separate action row above the filters made the
   * chrome taller than the one-thread list it sat on.
   */
  actionSlot?: ReactNode;
}

const SORT_OPTIONS = [
  { value: "latest", labelKey: "sortLatest" },
  { value: "top", labelKey: "sortTop" },
  { value: "unanswered", labelKey: "sortUnanswered" },
] as const;

const TYPE_OPTIONS = [
  { value: undefined, labelKey: "filterAll" },
  { value: "question", labelKey: "filterQuestions" },
  { value: "discussion", labelKey: "filterDiscussions" },
] as const;

export function ThreadFilters({
  sort,
  onSortChange,
  type,
  onTypeChange,
  showTypeFilter = true,
  courseOnly = false,
  onCourseOnlyChange,
  showCourseFilter = false,
  actionSlot,
}: ThreadFiltersProps) {
  const t = useTranslations("community");

  return (
    // ONE row: sort + type/scope filters on the left, the primary action on
    // the right.
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {/* Sort tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-[var(--border-default)] bg-[var(--surface)] p-0.5">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSortChange(opt.value)}
            className={cn(
              "whitespace-nowrap rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
              sort === opt.value
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-2)] hover:bg-[var(--card-hover)] hover:text-[var(--text)]"
            )}
          >
            {t(opt.labelKey)}
          </button>
        ))}
      </div>

      {/* Type filter */}
      {showTypeFilter && (
        <div className="flex gap-1">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.labelKey}
              type="button"
              onClick={() => onTypeChange(opt.value)}
              className={cn(
                "whitespace-nowrap rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                type === opt.value
                  ? "font-bold text-[var(--primary)]"
                  : "text-[var(--text-2)] hover:text-[var(--text)]"
              )}
            >
              {t(opt.labelKey)}
            </button>
          ))}
          {showCourseFilter && onCourseOnlyChange && (
            <button
              type="button"
              aria-pressed={courseOnly}
              onClick={() => onCourseOnlyChange(!courseOnly)}
              className={cn(
                "whitespace-nowrap rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                courseOnly
                  ? "font-bold text-[var(--primary)]"
                  : "text-[var(--text-2)] hover:text-[var(--text)]"
              )}
            >
              {t("filterCourseQuestions")}
            </button>
          )}
        </div>
      )}

      {actionSlot && <div className="ml-auto shrink-0">{actionSlot}</div>}
    </div>
  );
}
