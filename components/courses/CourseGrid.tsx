"use client";

import { useMemo, useState } from "react";
import { useEffect } from "react";
import { CourseCard } from "@/components/courses/CourseCard";
import type { CmsCourse, CmsCourseDifficulty } from "@/lib/cms/types";
import { useI18n } from "@/lib/i18n/provider";

const difficulties: Array<CmsCourseDifficulty | "all"> = ["all", "beginner", "intermediate", "advanced"];

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

  return (
    <section className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("courses.searchPlaceholder")}
          className="h-10 rounded-md border bg-background px-3 text-sm"
          aria-label={t("common.search")}
        />
        <select
          value={difficulty}
          onChange={(event) => setDifficulty(event.target.value as CmsCourseDifficulty | "all")}
          className="h-10 rounded-md border bg-background px-3 text-sm"
          aria-label={t("courses.difficultyLabel")}
        >
          {difficulties.map((value) => (
            <option key={value} value={value}>
              {value === "all" ? t("common.all") : t(`common.${value}`)}
            </option>
          ))}
        </select>
      </div>

      {filteredCourses.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("courses.empty")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => (
            <CourseCard key={course.slug} course={course} />
          ))}
        </div>
      )}
    </section>
  );
}
