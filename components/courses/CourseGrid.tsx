"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, BookOpen } from "lucide-react";
import { CourseCard } from "@/components/courses/CourseCard";
import type { CmsCourse, CmsCourseDifficulty } from "@/lib/cms/types";
import { useI18n } from "@/lib/i18n/provider";

const difficulties: Array<CmsCourseDifficulty | "all"> = ["all", "beginner", "intermediate", "advanced"];

const difficultyColors: Record<string, string> = {
  all: "",
  beginner: "data-[active=true]:border-emerald-500/40 data-[active=true]:bg-emerald-500/10 data-[active=true]:text-emerald-500",
  intermediate: "data-[active=true]:border-amber-500/40 data-[active=true]:bg-amber-500/10 data-[active=true]:text-amber-500",
  advanced: "data-[active=true]:border-red-500/40 data-[active=true]:bg-red-500/10 data-[active=true]:text-red-500",
};

export function CourseGrid(): JSX.Element {
  const { t } = useI18n();
  const [courses, setCourses] = useState<CmsCourse[]>([]);
  const [searchMatchedSlugs, setSearchMatchedSlugs] = useState<Set<string> | null>(null);
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<CmsCourseDifficulty | "all">("all");

  useEffect(() => {
    const run = async () => {
      const response = await fetch("/api/courses");
      const json = (await response.json()) as { courses: CmsCourse[] };
      setCourses(json.courses);
    };

    void run();
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchMatchedSlugs(null);
      return;
    }

    const run = async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
      const json = (await response.json()) as { results: Array<{ type: string; slug: string }> };
      const slugs = new Set(
        json.results.map((result) => (result.type === "lesson" ? result.slug.split("/lessons/")[0] : result.slug))
      );
      setSearchMatchedSlugs(slugs);
    };

    void run();
  }, [query]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesDifficulty = difficulty === "all" || course.difficulty === difficulty;
      const input = query.trim().toLowerCase();
      const matchesQuery =
        input.length === 0 ||
        (searchMatchedSlugs ? searchMatchedSlugs.has(course.slug) : true) ||
        course.title.toLowerCase().includes(input) ||
        course.description.toLowerCase().includes(input) ||
        course.topic.toLowerCase().includes(input);
      return matchesDifficulty && matchesQuery;
    });
  }, [courses, difficulty, query, searchMatchedSlugs]);

  const totalLessons = filteredCourses.reduce(
    (sum, c) => sum + c.modules.reduce((s, m) => s + m.lessons.length, 0),
    0
  );
  const totalHours = filteredCourses.reduce((sum, c) => sum + c.durationHours, 0);

  return (
    <section className="space-y-6">
      {/* Search + Filter bar */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("courses.searchPlaceholder")}
            className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:border-solana-purple/50 focus:ring-1 focus:ring-solana-purple/30"
            aria-label={t("common.search")}
          />
        </div>

        {/* Difficulty filter pills */}
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="mr-1 h-4 w-4 shrink-0 text-muted-foreground" />
          {difficulties.map((value) => {
            const active = difficulty === value;
            const colorClass = difficultyColors[value] ?? "";
            return (
              <button
                key={value}
                data-active={active}
                onClick={() => setDifficulty(value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active && value === "all"
                    ? "border-solana-purple/40 bg-solana-purple/10 text-solana-purple"
                    : active
                      ? colorClass
                      : "border-transparent text-muted-foreground hover:bg-muted"
                }`}
              >
                {value === "all" ? t("common.all") : t(`common.${value}`)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing <span className="font-medium text-foreground">{filteredCourses.length}</span> course{filteredCourses.length !== 1 ? "s" : ""}
        </span>
        <span className="hidden sm:inline">
          {totalLessons} lessons &middot; {totalHours}h of content
        </span>
      </div>

      {/* Grid or empty state */}
      {filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">{t("courses.empty")}</p>
          <p className="text-xs text-muted-foreground">Try adjusting your search or filter.</p>
          <button
            onClick={() => { setQuery(""); setDifficulty("all"); }}
            className="mt-1 text-xs font-medium text-solana-purple hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="stagger-children grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => (
            <CourseCard key={course.slug} course={course} />
          ))}
        </div>
      )}
    </section>
  );
}
