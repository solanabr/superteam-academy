"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, Loader2, X } from "lucide-react";
import { useLearningProgress } from "@/lib/hooks/use-learning-progress";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { CourseFilters, type Duration, type Sort } from "./course-filters";
import { CourseGrid } from "./course-grid";
import { cn } from "@/lib/utils";
import type { Course } from "@/types";

export interface CourseCatalogClientProps {
  courses: Course[];
}

function parseDurationHours(duration: string): number {
  const match = duration.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const DURATION_OPTIONS: { value: Duration; label: string }[] = [
  { value: "lt2", label: "< 2 hours" },
  { value: "2to5", label: "2–5 hours" },
  { value: "gt5", label: "5+ hours" },
];

export function CourseCatalogClient({ courses }: CourseCatalogClientProps) {
  const t = useTranslations("courses");
  const { progressMap } = useLearningProgress();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [debouncedSearch, isSearchPending] = useDebounce(search, 300);

  const selectedDifficulty = searchParams.get("difficulty") || "all";
  const selectedTrack = searchParams.get("track")
    ? Number(searchParams.get("track"))
    : null;
  const selectedDuration = (searchParams.get("duration") as Duration) || "all";
  const sort = (searchParams.get("sort") as Sort) || "newest";

  // Sync debounced search to URL
  useEffect(() => {
    const currentQ = searchParams.get("q") || "";
    if (debouncedSearch !== currentQ) {
      const params = new URLSearchParams(searchParams.toString());
      if (debouncedSearch) params.set("q", debouncedSearch);
      else params.delete("q");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [debouncedSearch, searchParams, router, pathname]);

  // ⌘K / Ctrl+K focuses search
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("course-search")?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "" || value === "all")
          params.delete(key);
        else params.set(key, value);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  const setSelectedDifficulty = (d: string) => updateParams({ difficulty: d });
  const setSelectedTrack = (id: number | null) =>
    updateParams({ track: id !== null ? String(id) : null });
  const setSelectedDuration = (d: Duration) => updateParams({ duration: d });
  const setSort = (s: Sort) =>
    updateParams({ sort: s === "newest" ? null : s });

  const filteredCourses = useMemo(() => {
    let result = courses.filter((course) => {
      const q = debouncedSearch.toLowerCase();
      const matchesSearch =
        !debouncedSearch ||
        course.title.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q) ||
        course.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        course.creator.toLowerCase().includes(q) ||
        course.modules.some(
          (m) =>
            m.title.toLowerCase().includes(q) ||
            m.lessons.some((l) => l.title.toLowerCase().includes(q)),
        );

      const matchesDifficulty =
        selectedDifficulty === "all" ||
        course.difficulty === selectedDifficulty;

      const matchesTrack =
        selectedTrack === null || course.trackId === selectedTrack;

      const hours = parseDurationHours(course.duration);
      const matchesDuration =
        selectedDuration === "all" ||
        (selectedDuration === "lt2" && hours < 2) ||
        (selectedDuration === "2to5" && hours >= 2 && hours <= 5) ||
        (selectedDuration === "gt5" && hours > 5);

      return (
        matchesSearch && matchesDifficulty && matchesTrack && matchesDuration
      );
    });

    if (sort === "popular") {
      result = [...result].sort(
        (a, b) => b.totalEnrollments - a.totalEnrollments,
      );
    } else if (sort === "xp") {
      result = [...result].sort((a, b) => b.xpTotal - a.xpTotal);
    } else {
      result = [...result].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    return result;
  }, [
    courses,
    debouncedSearch,
    selectedDifficulty,
    selectedTrack,
    selectedDuration,
    sort,
  ]);

  const activeFilters =
    (selectedDifficulty !== "all" ? 1 : 0) +
    (selectedTrack !== null ? 1 : 0) +
    (selectedDuration !== "all" ? 1 : 0);

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        {isSearchPending ? (
          <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
        ) : (
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <input
          id="course-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("catalog.searchPlaceholder")}
          className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-16 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {search ? (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:flex">
            ⌘ K
          </kbd>
        )}
      </div>

      {/* Horizontal filter bar: Difficulty · Duration · Sort */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Difficulty pills */}
        <div className="flex items-center gap-1.5">
          {DIFFICULTIES.map((d) => (
            <FilterPill
              key={d}
              active={selectedDifficulty === d}
              onClick={() =>
                setSelectedDifficulty(selectedDifficulty === d ? "all" : d)
              }
            >
              {DIFFICULTY_LABEL[d]}
            </FilterPill>
          ))}
        </div>

        <div className="h-5 w-px bg-border" />

        {/* Duration pills */}
        <div className="flex items-center gap-1.5">
          {DURATION_OPTIONS.map((opt) => (
            <FilterPill
              key={opt.value}
              active={selectedDuration === opt.value}
              onClick={() =>
                setSelectedDuration(
                  selectedDuration === opt.value ? "all" : opt.value,
                )
              }
            >
              {opt.label}
            </FilterPill>
          ))}
        </div>

        <div className="h-5 w-px bg-border" />

        {/* Sort By */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="newest">{t("filters.sortRecent")}</option>
          <option value="popular">{t("filters.sortPopular")}</option>
          <option value="xp">{t("filters.sortXP")}</option>
        </select>

        {/* Clear */}
        {(activeFilters > 0 || search) && (
          <>
            <div className="h-5 w-px bg-border" />
            <button
              onClick={() => {
                setSearch("");
                updateParams({
                  difficulty: null,
                  track: null,
                  duration: null,
                  sort: null,
                  q: null,
                });
              }}
              className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          </>
        )}

        {/* Result count — pushed right */}
        <span className="ml-auto text-sm text-muted-foreground">
          {t("catalog.resultsCount", { count: filteredCourses.length })}
        </span>
      </div>

      {/* Track sidebar + grid */}
      <div className="flex flex-col lg:flex-row items-start gap-4 lg:gap-8">
        <CourseFilters
          selectedTrack={selectedTrack}
          onTrackChange={setSelectedTrack}
        />
        <div className="flex-1 min-w-0">
          <CourseGrid courses={filteredCourses} progressMap={progressMap} />
        </div>
      </div>
    </div>
  );
}
