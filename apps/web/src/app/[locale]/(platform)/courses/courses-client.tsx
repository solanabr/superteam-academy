"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import type { Course, LearningPath } from "@superteam-lms/types";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { CourseCard } from "@/components/course/course-card";
import { type PathCourseProgress } from "@/components/course/learning-path-section";
import { PathsView } from "@/components/course/paths-view";
import {
  buildStatusMap,
  filterCatalogCourses,
  type CourseStatus,
  type Difficulty,
  type StatusFilter,
} from "@/lib/courses/catalog-filter";
import { useSegmentState } from "@/lib/onboarding/use-segment-state";
import { createClient } from "@/lib/supabase/client";

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

const ALL_STATUSES: (StatusFilter | "all")[] = [
  "all",
  "enrolled",
  "not-enrolled",
  "completed",
];

const STATUS_LABEL_KEY = {
  enrolled: "enrolled",
  "not-enrolled": "notEnrolled",
  completed: "completed",
} as const satisfies Record<StatusFilter, string>;

function useCourseProgress(courses: Course[]) {
  const [statuses, setStatuses] = useState<Map<string, CourseStatus>>(
    new Map()
  );
  const [progress, setProgress] = useState<Map<string, PathCourseProgress>>(
    new Map()
  );
  // Drives whether the status rail exists at all — an anonymous visitor has no
  // enrollment state to filter on, so the rail would be three dead options.
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;
      setIsSignedIn(true);

      const [
        { data: enrollments },
        { data: certificates },
        { data: lessonProgress },
      ] = await Promise.all([
        supabase
          .from("enrollments")
          .select("course_id, completed_at")
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

      const statusMap = buildStatusMap(
        enrollments ?? [],
        (certificates ?? []).map((row) => row.course_id)
      );
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

  return { statuses, progress, isSignedIn };
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
  const [activeStatus, setActiveStatus] = useState<StatusFilter | null>(null);
  const { statuses, progress, isSignedIn } = useCourseProgress(courses);
  // Segment/goal from the /start intake (LX-A3): drives the path-page modality
  // and the goal framing line. Absent for learners who never ran the intake.
  const { segment, goal } = useSegmentState();

  const filteredCourses = filterCatalogCourses(
    courses,
    { searchQuery, difficulty: activeDifficulty, status: activeStatus },
    statuses
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black tracking-[-0.5px] sm:text-3xl">
          {t("catalog")}
        </h1>
        <p className="mt-1 text-text-3">{t("catalogSubtitle")}</p>
      </div>

      {/* All Courses / Learning Paths is a segmented choice like any other, so
          it wears the same rail as the filters below it rather than its own
          underline-tab idiom (owner, 24-08). */}
      <SegmentedControl
        ariaLabel={t("view")}
        options={[
          { value: "all" as ActiveTab, label: t("allCourses") },
          { value: "paths" as ActiveTab, label: t("learningPaths") },
        ]}
        value={activeTab}
        onChange={setActiveTab}
        className="w-fit"
      />

      {/* ════════ TAB 1: ALL COURSES ════════ */}
      {activeTab === "all" && (
        <div className="space-y-3">
          {/* Row 1: search + the difficulty and status rails */}
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

            {/* Two rails side by side, the community idiom (owner, 24-08):
                segments grouped inside one bordered track, one track per axis.
                "All" is the null option on each, and the axes compose. */}
            <SegmentedControl
              ariaLabel={t("difficulty")}
              options={ALL_DIFFICULTIES.map((diff) => ({
                value: diff === "all" ? null : (diff as Difficulty),
                label: diff === "all" ? tCommon("all") : t(diff),
              }))}
              value={activeDifficulty}
              onChange={setActiveDifficulty}
            />

            {/* Status is the learner's own relationship to a course, so it has
                nothing to say to an anonymous visitor — the rail is absent
                rather than disabled. */}
            {isSignedIn && (
              <SegmentedControl
                ariaLabel={t("status")}
                options={ALL_STATUSES.map((status) => ({
                  value: status === "all" ? null : (status as StatusFilter),
                  label:
                    status === "all"
                      ? tCommon("all")
                      : t(STATUS_LABEL_KEY[status as StatusFilter]),
                }))}
                value={activeStatus}
                onChange={setActiveStatus}
              />
            )}
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
