"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseCard } from "@/components/course/course-card";
import { useCourses } from "@/hooks/use-courses";
import { TRACK_LABELS, DIFFICULTY_LABELS, type Difficulty } from "@/types";
import { cn } from "@/lib/utils";

const TRACKS = Object.entries(TRACK_LABELS);
const DIFFICULTIES = Object.entries(DIFFICULTY_LABELS);

export default function CourseCatalogPage() {
  const t = useTranslations("courses");
  const { data: courses, isLoading } = useCourses();

  const [search, setSearch] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<number | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [sort, setSort] = useState<"newest" | "popular" | "xp">("newest");

  const filtered = useMemo(() => {
    if (!courses) return [];
    let result = courses.filter((c) => c.isActive);

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.courseId.toLowerCase().includes(q));
    }
    if (selectedTrack !== null) {
      result = result.filter((c) => c.trackId === selectedTrack);
    }
    if (selectedDifficulty !== null) {
      result = result.filter((c) => c.difficulty === selectedDifficulty);
    }

    result.sort((a, b) => {
      if (sort === "popular") return b.totalEnrollments - a.totalEnrollments;
      if (sort === "xp")
        return b.lessonCount * b.xpPerLesson - a.lessonCount * a.xpPerLesson;
      return b.createdAt - a.createdAt;
    });

    return result;
  }, [courses, search, selectedTrack, selectedDifficulty, sort]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("catalogTitle")}</h1>
        <p className="text-muted-foreground">{t("catalogDescription")}</p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedTrack === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedTrack(null)}
          >
            {t("allTracks")}
          </Badge>
          {TRACKS.map(([id, label]) => (
            <Badge
              key={id}
              variant={selectedTrack === Number(id) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() =>
                setSelectedTrack(
                  selectedTrack === Number(id) ? null : Number(id)
                )
              }
            >
              {label}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedDifficulty === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedDifficulty(null)}
          >
            {t("allLevels")}
          </Badge>
          {DIFFICULTIES.map(([id, label]) => (
            <Badge
              key={id}
              variant={selectedDifficulty === Number(id) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() =>
                setSelectedDifficulty(
                  selectedDifficulty === Number(id) ? null : Number(id)
                )
              }
            >
              {label}
            </Badge>
          ))}
        </div>

        <div className="flex gap-2">
          {(["newest", "popular", "xp"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-md transition-colors",
                sort === s
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              {t(`sort_${s}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[280px] rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">{t("noCoursesFound")}</p>
          <p className="text-sm mt-2">{t("tryDifferentFilters")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course) => (
            <CourseCard key={course.courseId} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
