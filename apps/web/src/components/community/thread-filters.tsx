"use client";

import { cn } from "@/lib/utils";

interface ThreadFiltersProps {
  sort: string;
  onSortChange: (sort: string) => void;
  type: string | undefined;
  onTypeChange: (type: string | undefined) => void;
  showTypeFilter?: boolean;
}

const SORT_OPTIONS = [
  { value: "latest", label: "Latest" },
  { value: "top", label: "Top" },
  { value: "unanswered", label: "Unanswered" },
] as const;

const TYPE_OPTIONS = [
  { value: undefined, label: "All" },
  { value: "question", label: "Questions" },
  { value: "discussion", label: "Discussions" },
] as const;

export function ThreadFilters({
  sort,
  onSortChange,
  type,
  onTypeChange,
  showTypeFilter = true,
}: ThreadFiltersProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      {/* Sort tabs */}
      <div className="flex gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--surface)] p-1">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSortChange(opt.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              sort === opt.value
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-2)] hover:bg-[var(--card-hover)] hover:text-[var(--text)]"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Type filter */}
      {showTypeFilter && (
        <div className="flex gap-1">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => onTypeChange(opt.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                type === opt.value
                  ? "font-bold text-[var(--primary)]"
                  : "text-[var(--text-2)] hover:text-[var(--text)]"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
