"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CourseCard } from "@/components/courses/course-card";
import { SearchBar } from "@/components/shared/search-bar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCourses, useAllProgress } from "@/lib/hooks/use-service";
import { Skeleton } from "@/components/ui/skeleton";
import type { Difficulty } from "@/types/course";
import { TRACKS } from "@/types/course";

const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced"];

export default function CoursesPage() {
  const t = useTranslations("courses");
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [trackFilter, setTrackFilter] = useState<string>(
    searchParams.get("track") ?? "all",
  );

  const { data: courses, isLoading } = useCourses();
  const { data: allProgress } = useAllProgress();

  const filtered = useMemo(() => {
    if (!courses) return [];
    return courses.filter((c) => {
      if (search && !c.title.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (difficulty !== "all" && c.difficulty !== difficulty) return false;
      if (trackFilter !== "all" && c.trackId.toString() !== trackFilter)
        return false;
      return true;
    });
  }, [courses, search, difficulty, trackFilter]);

  const completedCourseIds = new Set(
    allProgress?.filter((p) => p.completedAt).map((p) => p.courseId) ?? [],
  );

  const getProgress = (courseId: string) => {
    const p = allProgress?.find((p) => p.courseId === courseId);
    return p?.percentComplete;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchBar
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={setSearch}
          className="sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={difficulty === "all" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setDifficulty("all")}
          >
            {t("allLevels")}
          </Badge>
          {DIFFICULTIES.map((d) => (
            <Badge
              key={d}
              variant={difficulty === d ? d : "outline"}
              className="cursor-pointer capitalize"
              onClick={() => setDifficulty(d)}
            >
              {d}
            </Badge>
          ))}
        </div>
        {mounted ? (
          <Select value={trackFilter} onValueChange={setTrackFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t("allTracks")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allTracks")}</SelectItem>
              {Object.entries(TRACKS).map(([id, track]) => (
                <SelectItem key={id} value={id}>
                  {track.display}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="h-10 w-48 rounded-lg border border-input bg-background" />
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[220px] rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-lg font-medium">{t("noCoursesFound")}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("adjustFilters")}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              progress={getProgress(course.id)}
              completed={
                completedCourseIds.has(course.id) ||
                completedCourseIds.has(course.slug)
              }
              prerequisiteMet={
                !course.prerequisiteId ||
                completedCourseIds.has(course.prerequisiteId)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
