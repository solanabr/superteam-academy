"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useCourses, type CourseAccount } from "@/hooks/use-courses";
import { CourseGrid } from "@/components/course/course-grid";
import { CourseFilters } from "@/components/course/course-filters";

export function CatalogSection({ initialCourses }: { initialCourses?: CourseAccount[] }) {
  const t = useTranslations("courses");
  const { data: courses } = useCourses(initialCourses);
  const [selectedTrack, setSelectedTrack] = useState<number | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const allCourses = useMemo(
    () => courses ?? initialCourses ?? [],
    [courses, initialCourses]
  );

  const tracks = useMemo(() => {
    return Array.from(new Set(allCourses.map((c) => c.trackId))).sort();
  }, [allCourses]);

  const filtered = useMemo(() => {
    let result = allCourses;
    if (selectedTrack !== null) {
      result = result.filter((c) => c.trackId === selectedTrack);
    }
    if (selectedDifficulty !== null) {
      result = result.filter((c) => c.difficulty === selectedDifficulty);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) => c.courseId.toLowerCase().includes(q));
    }
    return result;
  }, [allCourses, selectedTrack, selectedDifficulty, searchQuery]);

  return (
    <div id="catalog" className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-content">{t("title")}</h2>
        <p className="mt-2 text-content-secondary">{t("subtitle")}</p>
      </div>

      <div className="mb-6">
        <CourseFilters
          tracks={tracks}
          selectedTrack={selectedTrack}
          onTrackChange={setSelectedTrack}
          selectedDifficulty={selectedDifficulty}
          onDifficultyChange={setSelectedDifficulty}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      <CourseGrid courses={filtered} />
    </div>
  );
}
