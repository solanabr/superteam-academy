"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Course } from "@/lib/course-catalog";
import { CourseCard } from "./course-card";

const difficulties = [
  { value: "All", key: "filterAll" as const },
  { value: "Beginner", key: "filterBeginner" as const },
  { value: "Intermediate", key: "filterIntermediate" as const },
  { value: "Advanced", key: "filterAdvanced" as const },
];

export function CourseCatalog({ courses }: { courses: Course[] }) {
  const t = useTranslations("catalog");
  const allTags = useMemo(
    () => Array.from(new Set(courses.flatMap((c) => c.tags))),
    [courses],
  );
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<string>("All");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchSearch =
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase());
      const matchDiff = difficulty === "All" || c.difficulty === difficulty;
      const matchTag = !selectedTag || c.tags.includes(selectedTag);
      return matchSearch && matchDiff && matchTag;
    });
  }, [search, difficulty, selectedTag]);

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
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Button
            variant="outline"
            className="gap-2 border-border text-muted-foreground shrink-0"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">{t("filters")}</span>
          </Button>
        </div>

        {/* Difficulty filter */}
        <div className="flex flex-wrap items-center gap-2">
          {difficulties.map((d) => (
            <Button
              key={d.value}
              variant={difficulty === d.value ? "default" : "outline"}
              size="sm"
              onClick={() => setDifficulty(d.value)}
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
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Results info */}
      <p className="text-sm text-muted-foreground mb-6">
        {t("showing", { filtered: filtered.length, total: courses.length })}
      </p>

      {/* Course grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((course) => (
          <CourseCard key={course.slug} course={course} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-lg text-muted-foreground">{t("noResults")}</p>
          <Button
            variant="outline"
            className="mt-4 border-border text-muted-foreground"
            onClick={() => {
              setSearch("");
              setDifficulty("All");
              setSelectedTag(null);
            }}
          >
            {t("clearFilters")}
          </Button>
        </div>
      )}
    </div>
  );
}
