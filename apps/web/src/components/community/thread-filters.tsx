"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface ThreadFiltersProps {
  sort: string;
  onSortChange: (sort: string) => void;
  type: string | undefined;
  onTypeChange: (type: string | undefined) => void;
  showTypeFilter?: boolean;
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
}: ThreadFiltersProps) {
  const t = useTranslations("community");

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Sort tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-[var(--border-default)] bg-[var(--surface)] p-1">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSortChange(opt.value)}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
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
                "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
                type === opt.value
                  ? "font-bold text-[var(--primary)]"
                  : "text-[var(--text-2)] hover:text-[var(--text)]"
              )}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
