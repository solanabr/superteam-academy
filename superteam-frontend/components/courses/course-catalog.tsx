"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Search, SlidersHorizontal, ChevronDown, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CourseCardData } from "@/lib/course-catalog";
import { CourseCard } from "./course-card";

const PAGE_SIZE = 6;

const difficulties = [
  { value: "All", key: "filterAll" as const },
  { value: "Beginner", key: "filterBeginner" as const },
  { value: "Intermediate", key: "filterIntermediate" as const },
  { value: "Advanced", key: "filterAdvanced" as const },
];

export function CourseCatalog({
  initialCourses,
  totalCourses,
}: {
  initialCourses: CourseCardData[];
  totalCourses: number;
}) {
  const t = useTranslations("catalog");
  const [courses, setCourses] = useState<CourseCardData[]>(
    initialCourses ?? [],
  );
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<string>("All");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const allTags = useMemo(
    () => Array.from(new Set(courses.flatMap((c) => c.tags))),
    [courses],
  );

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchSearch =
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase());
      const matchDiff = difficulty === "All" || c.difficulty === difficulty;
      const matchTag = !selectedTag || c.tags.includes(selectedTag);
      return matchSearch && matchDiff && matchTag;
    });
  }, [courses, search, difficulty, selectedTag]);

  const hasMore = courses.length < totalCourses;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/courses?offset=${courses.length}&limit=${PAGE_SIZE}`,
      );
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setCourses((prev) => [...prev, ...data.courses]);
    } catch {
      // Silent fail — user can retry
    } finally {
      setLoading(false);
    }
  }, [courses.length, hasMore, loading]);

  const setSearchAndReset = useCallback((v: string) => {
    setSearch(v);
  }, []);
  const setDifficultyAndReset = useCallback((v: string) => {
    setDifficulty(v);
  }, []);
  const setTagAndReset = useCallback((v: string | null) => {
    setSelectedTag(v);
  }, []);

  return (
    <div>
      {/* Search and filters */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearchAndReset(e.target.value)}
              className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Button
            variant="outline"
            className={`gap-2 border-border shrink-0 ${
              filtersOpen
                ? "bg-primary/10 text-primary border-primary/30"
                : "text-muted-foreground"
            }`}
            onClick={() => setFiltersOpen((prev) => !prev)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">{t("filters")}</span>
          </Button>
        </div>

        {/* Difficulty filter */}
        <div
          className={`flex-wrap items-center gap-2 ${
            filtersOpen ? "flex" : "hidden sm:flex"
          }`}
        >
          {difficulties.map((d) => (
            <Button
              key={d.value}
              variant={difficulty === d.value ? "default" : "outline"}
              size="sm"
              onClick={() => setDifficultyAndReset(d.value)}
              className={
                difficulty === d.value
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border-border text-muted-foreground hover:text-foreground"
              }
            >
              {t(d.key)}
            </Button>
          ))}

          <div className="h-5 w-px bg-border mx-1" />

          {allTags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className={`cursor-pointer transition-colors ${
                selectedTag === tag
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
              onClick={() => setTagAndReset(selectedTag === tag ? null : tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Results info */}
      <p className="text-sm text-muted-foreground mb-6">
        {t("showing", { filtered: filtered.length, total: totalCourses })}
      </p>

      {/* Course grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((course) => (
          <CourseCard key={course.slug} course={course} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            className="gap-2 border-border text-muted-foreground hover:text-foreground"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {t("loadMore")}
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-lg text-muted-foreground">{t("noResults")}</p>
          <Button
            variant="outline"
            className="mt-4 border-border text-muted-foreground"
            onClick={() => {
              setSearchAndReset("");
              setDifficultyAndReset("All");
              setTagAndReset(null);
            }}
          >
            {t("clearFilters")}
          </Button>
        </div>
      )}
    </div>
  );
}
