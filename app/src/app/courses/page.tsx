"use client";

import { useState, useMemo } from "react";
import { useLocale } from "@/contexts/locale-context";
import { COURSES, LEARNING_PATHS } from "@/services/course-data";
import { CourseCard } from "@/components/course-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Rocket, TrendingUp, Palette, Shield } from "lucide-react";

const FILTERS = [
  { key: "filterAll", value: 0 },
  { key: "filterBeginner", value: 1 },
  { key: "filterIntermediate", value: 2 },
  { key: "filterAdvanced", value: 3 },
];

const PATH_ICONS: Record<string, typeof Rocket> = {
  rocket: Rocket,
  "trending-up": TrendingUp,
  palette: Palette,
  shield: Shield,
};

export default function CoursesPage() {
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState(0);

  const filteredCourses = useMemo(() => {
    let results = COURSES.filter((c) => c.isActive);

    if (difficulty > 0) {
      results = results.filter((c) => c.difficulty === difficulty);
    }

    if (search.trim()) {
      const lower = search.toLowerCase();
      results = results.filter(
        (c) =>
          c.title.toLowerCase().includes(lower) ||
          c.description.toLowerCase().includes(lower) ||
          c.tags.some((tag) => tag.includes(lower))
      );
    }

    return results;
  }, [search, difficulty]);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="border-b border-border/40 bg-gradient-to-b from-violet-500/5 to-transparent">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold sm:text-4xl">{t("courses.title")}</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {t("courses.subtitle")}
          </p>

          {/* Search and Filters */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("courses.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {FILTERS.map((filter) => (
                <Button
                  key={filter.value}
                  variant={difficulty === filter.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDifficulty(filter.value)}
                  className={
                    difficulty === filter.value
                      ? "bg-violet-600 hover:bg-violet-700"
                      : ""
                  }
                >
                  {t(`courses.${filter.key}`)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Learning Paths */}
        <div className="mb-10">
          <h2 className="mb-4 text-xl font-semibold">
            {t("landing.featuredPaths")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LEARNING_PATHS.map((path) => {
              const IconComponent = PATH_ICONS[path.icon] || Rocket;
              return (
                <Card
                  key={path.id}
                  className="border-border/40 transition-all hover:border-violet-500/40"
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                      <IconComponent className="h-5 w-5 text-violet-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{path.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {path.courses.length} courses &middot; ~{path.estimatedHours}h
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Course Grid */}
        {filteredCourses.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-muted-foreground">
              {t("courses.noResults")}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
