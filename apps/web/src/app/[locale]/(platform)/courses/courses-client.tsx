"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { CourseCard } from "@/components/course/course-card";
import {
  LearningPathSection,
  type PathCourseProgress,
} from "@/components/course/learning-path-section";
import { createClient } from "@/lib/supabase/client";
import type { Course, LearningPath } from "@/lib/sanity/types";

type Difficulty = "beginner" | "intermediate" | "advanced";
type CourseStatus = "enrolled" | "completed";
type ActiveTab = "all" | "paths";

interface CourseCatalogClientProps {
  courses: Course[];
  learningPaths: LearningPath[];
}

const ALL_DIFFICULTIES: (Difficulty | "all")[] = [
  "all",
  "beginner",
  "intermediate",
  "advanced",
];

function useCourseProgress(courses: Course[]) {
  const [statuses, setStatuses] = useState<Map<string, CourseStatus>>(
    new Map()
  );
  const [progress, setProgress] = useState<Map<string, PathCourseProgress>>(
    new Map()
  );

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      const [
        { data: enrollments },
        { data: certificates },
        { data: lessonProgress },
      ] = await Promise.all([
        supabase
          .from("enrollments")
          .select("course_id")
          .eq("user_id", session.user.id),
        supabase
          .from("certificates")
          .select("course_id")
          .eq("user_id", session.user.id),
        supabase
          .from("user_progress")
          .select("course_id, completed")
          .eq("user_id", session.user.id),
      ]);

      const statusMap = new Map<string, CourseStatus>();
      const progressMap = new Map<string, PathCourseProgress>();

      // Count completed lessons per course
      const completedByCourse = new Map<string, number>();
      for (const row of lessonProgress ?? []) {
        if (row.completed) {
          completedByCourse.set(
            row.course_id,
            (completedByCourse.get(row.course_id) ?? 0) + 1
          );
        }
      }

      for (const row of enrollments ?? []) {
        statusMap.set(row.course_id, "enrolled");
      }
      for (const row of certificates ?? []) {
        statusMap.set(row.course_id, "completed");
      }

      // Build progress entries enriched with total lesson counts
      for (const course of courses) {
        const status = statusMap.get(course._id);
        const totalLessons =
          course.modules?.reduce(
            (sum, m) => sum + (m.lessons?.length ?? 0),
            0
          ) ?? 0;

        progressMap.set(course._id, {
          courseId: course._id,
          completedLessons: completedByCourse.get(course._id) ?? 0,
          totalLessons,
          isCompleted: status === "completed",
          isEnrolled: status === "enrolled" || status === "completed",
        });
      }

      setStatuses(statusMap);
      setProgress(progressMap);
    }

    fetchData();
  }, [courses]);

  return { statuses, progress };
}

export function CourseCatalogClient({
  courses,
  learningPaths,
}: CourseCatalogClientProps) {
  const t = useTranslations("courses");
  const tCommon = useTranslations("common");
  const [activeTab, setActiveTab] = useState<ActiveTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty | null>(
    null
  );
  const [activePath, setActivePath] = useState<string | null>(null);
  const { statuses, progress } = useCourseProgress(courses);

  // Build reverse lookup: courseId → first learning path title (for course cards)
  const coursePathLabel = useMemo(() => {
    const map = new Map<string, string>();
    for (const path of learningPaths) {
      for (const course of path.courses ?? []) {
        if (!course) continue;
        if (!map.has(course._id)) {
          map.set(course._id, path.title);
        }
      }
    }
    return map;
  }, [learningPaths]);

  // Build reverse lookup: courseId → set of path slugs (for filtering)
  const coursePathSlugs = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const path of learningPaths) {
      for (const course of path.courses ?? []) {
        if (!course) continue;
        const set = map.get(course._id) ?? new Set();
        set.add(path.slug);
        map.set(course._id, set);
      }
    }
    return map;
  }, [learningPaths]);

  // Only show paths that have courses for the filter pills
  const pathsWithCourses = useMemo(
    () => learningPaths.filter((p) => (p.courses?.length ?? 0) > 0),
    [learningPaths]
  );

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      !searchQuery ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty =
      !activeDifficulty || course.difficulty === activeDifficulty;
    const matchesPath =
      !activePath ||
      (coursePathSlugs.get(course._id)?.has(activePath) ?? false);
    return matchesSearch && matchesDifficulty && matchesPath;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-black tracking-[-0.5px]">
          {t("catalog")}
        </h1>
        <p className="mt-1 text-text-3">{t("catalogSubtitle")}</p>
      </div>

      {/* Tabs */}
      <div className="catalog-tabs">
        <button
          className={`catalog-tab ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          {t("allCourses")}
        </button>
        <button
          className={`catalog-tab ${activeTab === "paths" ? "active" : ""}`}
          onClick={() => setActiveTab("paths")}
        >
          {t("learningPaths")}
        </button>
      </div>

      {/* ════════ TAB 1: ALL COURSES ════════ */}
      {activeTab === "all" && (
        <div className="space-y-3">
          {/* Row 1: Search + Difficulty pills */}
          <div className="filter-row">
            <div className="relative min-w-[200px] max-w-[400px] flex-1">
              <MagnifyingGlass
                size={15}
                weight="bold"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3"
              />
              <input
                type="text"
                placeholder={tCommon("search") + "..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-[var(--r-md)] border-[2.5px] border-border bg-card pl-9 pr-4 text-sm text-text shadow-[var(--shadow-sm)] outline-none transition-[border-color] duration-150 placeholder:text-text-3 focus:border-primary"
                aria-label={tCommon("search")}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text"
                  aria-label={tCommon("close")}
                >
                  <X size={14} weight="bold" />
                </button>
              )}
            </div>

            <div className="filter-pills">
              {ALL_DIFFICULTIES.map((diff) => (
                <button
                  key={diff}
                  onClick={() =>
                    setActiveDifficulty(
                      diff === "all"
                        ? null
                        : diff === activeDifficulty
                          ? null
                          : diff
                    )
                  }
                  className={`filter-pill ${
                    diff === "all"
                      ? !activeDifficulty
                        ? "active"
                        : ""
                      : activeDifficulty === diff
                        ? "active"
                        : ""
                  }`}
                >
                  {diff === "all" ? tCommon("all") : t(diff)}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Path pills */}
          <div className="filter-row">
            <div className="filter-pills">
              <button
                className={`path-pill ${!activePath ? "active" : ""}`}
                onClick={() => setActivePath(null)}
              >
                {t("allPaths")}
              </button>
              {pathsWithCourses.map((path) => (
                <button
                  key={path.slug}
                  className={`path-pill ${activePath === path.slug ? "active" : ""}`}
                  onClick={() =>
                    setActivePath(activePath === path.slug ? null : path.slug)
                  }
                >
                  {path.title}
                </button>
              ))}
            </div>
          </div>

          {/* Course Grid */}
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => {
                const p = progress.get(course._id);
                return (
                  <CourseCard
                    key={course._id}
                    slug={course.slug}
                    title={course.title}
                    description={course.description}
                    difficulty={course.difficulty}
                    duration={course.duration}
                    lessonCount={course.modules?.reduce(
                      (sum, m) => sum + (m.lessons?.length ?? 0),
                      0
                    )}
                    completedLessons={p?.completedLessons ?? 0}
                    xpReward={course.xpReward}
                    pathLabel={coursePathLabel.get(course._id)}
                    trackLevel={course.trackLevel}
                    thumbnail={course.thumbnail}
                    status={statuses.get(course._id)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-subtle">
                <MagnifyingGlass
                  size={32}
                  weight="duotone"
                  className="text-text-3"
                />
              </div>
              <p className="text-text-3">{t("noResults")}</p>
            </div>
          )}
        </div>
      )}

      {/* ════════ TAB 2: LEARNING PATHS ════════ */}
      {activeTab === "paths" && (
        <div className="space-y-8">
          {learningPaths.map((path, idx) => {
            if ((path.courses?.length ?? 0) === 0) return null;
            return (
              <LearningPathSection
                key={path._id}
                learningPath={path}
                progress={progress}
                defaultOpen={idx === 0}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
