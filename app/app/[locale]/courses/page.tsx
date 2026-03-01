import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { LearningPathsSection } from "@/components/courses/learning-paths-section";
import { FilterBar } from "@/components/courses/filter-bar";
import { CourseCard } from "@/components/courses/course-card";
import { EmptyState } from "@/components/courses/empty-state";
import { filterCourses, getAllTracks } from "@/lib/data/queries";
import type { Difficulty, FilterParams, SortOption } from "@/lib/data/types";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("courses");
  return {
    title: `${t("title")} | Superteam Academy`,
    description: t("subtitle"),
  };
}

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CoursesPage({ searchParams }: Props) {
  const params = await searchParams;
  const t = await getTranslations("courses");
  const tracks = getAllTracks();

  const filterParams: FilterParams = {};

  if (typeof params.q === "string" && params.q) {
    filterParams.q = params.q;
  }
  if (typeof params.difficulty === "string" && params.difficulty !== "all") {
    const d = Number(params.difficulty);
    if (d === 1 || d === 2 || d === 3) {
      filterParams.difficulty = d as Difficulty;
    }
  }
  if (typeof params.track === "string" && params.track !== "all") {
    filterParams.track = params.track;
  }
  if (typeof params.sort === "string") {
    const validSorts: SortOption[] = ["popular", "newest", "xp-high", "xp-low"];
    if (validSorts.includes(params.sort as SortOption)) {
      filterParams.sort = params.sort as SortOption;
    }
  }

  const courses = filterCourses(filterParams);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          {t("subtitle")}
        </p>
      </header>

      <div className="mt-8">
        <LearningPathsSection title={t("learningPaths")} />
      </div>

      <div className="mt-10">
        <h2 className="font-heading text-lg font-semibold">Browse Courses</h2>

        <div className="mt-4">
          <Suspense>
            <FilterBar tracks={tracks} resultCount={courses.length} />
          </Suspense>
        </div>

        {courses.length > 0 ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState
              title={t("noResults")}
              description={t("noResultsDescription")}
            />
          </div>
        )}
      </div>
    </main>
  );
}
