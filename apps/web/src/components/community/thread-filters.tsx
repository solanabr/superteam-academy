"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { SegmentedControl } from "@/components/ui/segmented-control";
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
      {/* Sort and type are both segmented controls — the shared one, so their
          selected state is the same object as a selected day key or a primary
          button rather than this file's own flat primary fill. */}
      <SegmentedControl
        options={SORT_OPTIONS.map((opt) => ({
          value: opt.value as string,
          label: t(opt.labelKey),
        }))}
        value={sort}
        onChange={onSortChange}
        ariaLabel={t("sortLabel")}
      />

      {showTypeFilter && (
        <SegmentedControl
          options={TYPE_OPTIONS.map((opt) => ({
            value: opt.value as string | undefined,
            label: t(opt.labelKey),
          }))}
          value={type}
          onChange={onTypeChange}
          ariaLabel={t("filterLabel")}
        />
      )}

      {/* "Course questions" — an independent scope TOGGLE (a course question
          is still a question), so it renders as a chip, not a segment */}
      {showTypeFilter && showCourseFilter && onCourseOnlyChange && (
        <button
          type="button"
          aria-pressed={courseOnly}
          onClick={() => onCourseOnlyChange(!courseOnly)}
          className={cn(
            "whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
            courseOnly
              ? "border-[var(--primary-border)] bg-[var(--primary-dim)] font-bold text-[var(--primary)]"
              : "border-[var(--border-default)] text-[var(--text-2)] hover:text-[var(--text)]"
          )}
        >
          {t("filterCourseQuestions")}
        </button>
      )}

      {actionSlot && <div className="ml-auto shrink-0">{actionSlot}</div>}
    </div>
  );
}
