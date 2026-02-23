"use client";

import { useTranslations } from "next-intl";

interface CourseFiltersProps {
  tracks: number[];
  selectedTrack: number | null;
  onTrackChange: (track: number | null) => void;
  selectedDifficulty: number | null;
  onDifficultyChange: (difficulty: number | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function CourseFilters({
  tracks,
  selectedTrack,
  onTrackChange,
  selectedDifficulty,
  onDifficultyChange,
  searchQuery,
  onSearchChange,
}: CourseFiltersProps) {
  const t = useTranslations("courses");

  const difficulties = [
    { value: 1, label: t("beginner") },
    { value: 2, label: t("intermediate") },
    { value: 3, label: t("advanced") },
  ];

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="w-full rounded-lg border border-edge bg-surface py-2.5 pl-10 pr-4 text-sm text-content placeholder:text-content-muted focus:border-solana-purple focus:outline-none focus:ring-1 focus:ring-solana-purple/50"
        />
      </div>

      <div className="flex flex-wrap items-center gap-6">
        {/* Track filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onTrackChange(null)}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              selectedTrack === null
                ? "bg-solana-purple/20 text-solana-purple font-medium"
                : "border border-edge text-content-secondary hover:text-content"
            }`}
          >
            {t("filterAll")}
          </button>
          {tracks.map((track) => (
            <button
              key={track}
              onClick={() => onTrackChange(track)}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                selectedTrack === track
                  ? "bg-solana-purple/20 text-solana-purple font-medium"
                  : "border border-edge text-content-secondary hover:text-content"
              }`}
            >
              {t("track")} {track}
            </button>
          ))}
        </div>

        {/* Difficulty filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onDifficultyChange(null)}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              selectedDifficulty === null
                ? "bg-solana-cyan/20 text-solana-cyan"
                : "border border-edge text-content-secondary hover:text-content"
            }`}
          >
            {t("allDifficulties")}
          </button>
          {difficulties.map((d) => (
            <button
              key={d.value}
              onClick={() => onDifficultyChange(d.value)}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                selectedDifficulty === d.value
                  ? "bg-solana-cyan/20 text-solana-cyan"
                  : "border border-edge text-content-secondary hover:text-content"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
