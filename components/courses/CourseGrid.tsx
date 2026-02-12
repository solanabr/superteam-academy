"use client";

import { useMemo, useState } from "react";
import { CourseCard } from "@/components/courses/CourseCard";
import { mockCourses, type CourseDifficulty } from "@/lib/content/courses";
import { useI18n } from "@/lib/i18n/provider";

const difficulties: Array<CourseDifficulty | "all"> = ["all", "beginner", "intermediate", "advanced"];

export function CourseGrid(): JSX.Element {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<CourseDifficulty | "all">("all");

  const filteredCourses = useMemo(() => {
    return mockCourses.filter((course) => {
      const matchesDifficulty = difficulty === "all" || course.difficulty === difficulty;
      const input = query.trim().toLowerCase();
      const matchesQuery =
        input.length === 0 ||
        course.title.toLowerCase().includes(input) ||
        course.description.toLowerCase().includes(input) ||
        course.topic.toLowerCase().includes(input);
      return matchesDifficulty && matchesQuery;
    });
  }, [difficulty, query]);

  return (
    <section className="space-y-6">
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
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
          onChange={(event) => setDifficulty(event.target.value as CourseDifficulty | "all")}
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <CourseCard key={course.slug} course={course} />
          ))}
        </div>
      )}
    </section>
  );
}
