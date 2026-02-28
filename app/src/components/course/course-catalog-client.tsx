"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useLearningProgress } from "@/lib/hooks/use-learning-progress";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { CourseFilters } from "./course-filters";
import { CourseGrid } from "./course-grid";
import type { Course } from "@/types";

export interface CourseCatalogClientProps {
  /** Pre-fetched courses from the server (CMS or mock fallback) */
  courses: Course[];
}

/**
 * Client-side interactive portion of the course catalog page.
 * Handles search, filtering, URL param syncing, and learning progress overlay.
 */
export function CourseCatalogClient({ courses }: CourseCatalogClientProps) {
  const t = useTranslations("courses");
  const { progressMap } = useLearningProgress();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [debouncedSearch, isSearchPending] = useDebounce(search, 300);
  const selectedDifficulty = searchParams.get("difficulty") || "all";
  const selectedTrack = searchParams.get("track") ? Number(searchParams.get("track")) : null;

  // Sync debounced search to URL params
  useEffect(() => {
    const currentQ = searchParams.get("q") || "";
    if (debouncedSearch !== currentQ) {
      const params = new URLSearchParams(searchParams.toString());
      if (debouncedSearch) {
        params.set("q", debouncedSearch);
      } else {
        params.delete("q");
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [debouncedSearch, searchParams, router, pathname]);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const setSelectedDifficulty = (d: string) => updateParams({ difficulty: d });
  const setSelectedTrack = (t: number | null) => updateParams({ track: t !== null ? String(t) : null });

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const q = debouncedSearch.toLowerCase();
      const matchesSearch =
        !debouncedSearch ||
        course.title.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q) ||
        course.tags.some((t) => t.toLowerCase().includes(q)) ||
        course.creator.toLowerCase().includes(q) ||
        course.modules.some((m) =>
          m.title.toLowerCase().includes(q) ||
          m.lessons.some((l) => l.title.toLowerCase().includes(q))
        );

      const matchesDifficulty =
        selectedDifficulty === "all" || course.difficulty === selectedDifficulty;

      const matchesTrack = selectedTrack === null || course.trackId === selectedTrack;

      return matchesSearch && matchesDifficulty && matchesTrack;
    });
  }, [courses, debouncedSearch, selectedDifficulty, selectedTrack]);

  const activeFilters =
    (selectedDifficulty !== "all" ? 1 : 0) + (selectedTrack !== null ? 1 : 0);

  return (
    <>
      {/* Search & Filters */}
      <CourseFilters
        search={search}
        onSearchChange={setSearch}
        selectedDifficulty={selectedDifficulty}
        onDifficultyChange={setSelectedDifficulty}
        selectedTrack={selectedTrack}
        onTrackChange={setSelectedTrack}
        activeFilters={activeFilters}
        onClearFilters={() => {
          setSearch("");
          updateParams({ difficulty: "all", track: null, q: null });
        }}
        isSearchPending={isSearchPending}
      />

      {/* Results count */}
      <div className="mb-6 text-sm text-muted-foreground">
        {t("catalog.resultsCount", { count: filteredCourses.length })}
      </div>

      {/* Course Grid */}
      <CourseGrid courses={filteredCourses} progressMap={progressMap} />
    </>
  );
}
