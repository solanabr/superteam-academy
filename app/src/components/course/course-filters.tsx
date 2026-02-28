"use client";

import { useTranslations } from "next-intl";
import { Search, X, Loader2 } from "lucide-react";
import { TRACKS } from "@/lib/constants";

const DIFFICULTIES = ["all", "beginner", "intermediate", "advanced"] as const;

const DIFFICULTY_LABEL_KEYS: Record<string, string> = {
  all: "filters.allDifficulties",
  beginner: "filters.difficultyBeginner",
  intermediate: "filters.difficultyIntermediate",
  advanced: "filters.difficultyAdvanced",
};

export interface CourseFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedDifficulty: string;
  onDifficultyChange: (difficulty: string) => void;
  selectedTrack: number | null;
  onTrackChange: (trackId: number | null) => void;
  activeFilters: number;
  onClearFilters: () => void;
  isSearchPending?: boolean;
}

export function CourseFilters({
  search,
  onSearchChange,
  selectedDifficulty,
  onDifficultyChange,
  selectedTrack,
  onTrackChange,
  activeFilters,
  onClearFilters,
  isSearchPending,
}: CourseFiltersProps) {
  const t = useTranslations("courses");

  return (
    <div className="mb-8 space-y-4">
      {/* Search bar */}
      <div className="relative">
        {isSearchPending ? (
          <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
        ) : (
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("catalog.searchPlaceholder")}
          className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {/* Difficulty */}
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            onClick={() => onDifficultyChange(d)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedDifficulty === d
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {t(DIFFICULTY_LABEL_KEYS[d])}
          </button>
        ))}

        <div className="mx-1 h-6 w-px bg-border" />

        {/* Tracks */}
        {Object.entries(TRACKS).map(([id, track]) => (
          <button
            key={id}
            onClick={() =>
              onTrackChange(selectedTrack === Number(id) ? null : Number(id))
            }
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedTrack === Number(id)
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {track.display}
          </button>
        ))}

        {(activeFilters > 0 || search) && (
          <button
            onClick={onClearFilters}
            className="rounded-full px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
          >
            {t("catalog.clearFilters")}
          </button>
        )}
      </div>
    </div>
  );
}
