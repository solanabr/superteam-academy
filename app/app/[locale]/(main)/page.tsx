"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useCourses } from "@/hooks/use-courses";
import { CourseGrid } from "@/components/course/course-grid";
import { CourseFilters } from "@/components/course/course-filters";
import { CardSkeleton } from "@/components/ui/skeleton";
import { HeroSection } from "@/components/landing/hero-section";
import { FeatureCards } from "@/components/landing/feature-cards";
import { Footer } from "@/components/landing/footer";

export default function CatalogPage() {
  const t = useTranslations("courses");
  const { data: courses, isLoading } = useCourses();
  const [selectedTrack, setSelectedTrack] = useState<number | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const tracks = useMemo(() => {
    if (!courses) return [];
    return Array.from(new Set(courses.map((c) => c.trackId))).sort();
  }, [courses]);

  const filtered = useMemo(() => {
    if (!courses) return [];
    let result = courses;
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
  }, [courses, selectedTrack, selectedDifficulty, searchQuery]);

  return (
    <>
      <HeroSection />
      <FeatureCards />

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

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <CourseGrid courses={filtered} />
        )}
      </div>

      <Footer />
    </>
  );
}
