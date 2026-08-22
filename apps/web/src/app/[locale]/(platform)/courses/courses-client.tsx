"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import type { Course, LearningPath } from "@superteam-lms/types";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { CourseCard } from "@/components/course/course-card";
import { type PathCourseProgress } from "@/components/course/learning-path-section";
import { PathsView } from "@/components/course/paths-view";
import { useSegmentState } from "@/lib/onboarding/use-segment-state";
import { createClient } from "@/lib/supabase/client";

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
  const { statuses, progress } = useCourseProgress(courses);
  // Segment/goal from the /start intake (LX-A3): drives the path-page modality
  // and the goal framing line. Absent for learners who never ran the intake.
  const { segment, goal } = useSegmentState();

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      !searchQuery ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty =
      !activeDifficulty || course.difficulty === activeDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black tracking-[-0.5px] sm:text-3xl">
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
            <div className="relative w-full max-w-[400px] flex-1 sm:min-w-[200px]">
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

            {/* The difficulty row is a segmented control like the community
                filters — "All" is just the null option, so picking a segment
                replaces the old click-the-active-one-to-clear behaviour. */}
            <SegmentedControl
              variant="pills"
              ariaLabel={t("difficulty")}
              options={ALL_DIFFICULTIES.map((diff) => ({
                value: diff === "all" ? null : (diff as Difficulty),
                label: diff === "all" ? tCommon("all") : t(diff),
              }))}
              value={activeDifficulty}
              onChange={setActiveDifficulty}
            />
          </div>

          {/* Course Grid */}
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course, i) => {
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
                    thumbnail={course.thumbnail}
                    status={statuses.get(course._id)}
                    style={{ "--i": i } as React.CSSProperties}
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

      {/* ════════ TAB 2: LEARNING PATHS (LX-A7) ════════ */}
      {/* segment/goal come from the /start intake (LX-A3); both are undefined
          for learners who never ran it, and PathsView defaults to the
          segment-1 presentation with no goal framing. */}
      {activeTab === "paths" && (
        <PathsView
          learningPaths={learningPaths}
          progress={progress}
          segment={segment}
          goal={goal}
        />
      )}
    </div>
  );
}
