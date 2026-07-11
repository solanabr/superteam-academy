"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CaretDown } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { InstructorCourseSummary } from "@/lib/content/queries";

interface CourseStatsView {
  enrolledCount: number;
  completionCount: number;
  certificateCount: number;
}

type StatsState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "loaded"; stats: CourseStatsView };

interface InstructorCoursesProps {
  courses: InstructorCourseSummary[];
}

/**
 * Read-only `/teach` viewer body (issue #359 follow-up — wallet-keyed teach
 * replacement for the deleted CRUD authoring surface). `courses` is already
 * scoped server-side to the caller's own wallet via `getInstructorCourses`;
 * this component only handles the expand/collapse UI and the per-course
 * stats fetch, which goes through `/api/teacher/courses/[id]/stats`
 * (instructor-wallet-gated, Task 7).
 */
export function InstructorCourses({ courses }: InstructorCoursesProps) {
  const t = useTranslations("teach");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [statsById, setStatsById] = useState<Record<string, StatsState>>({});

  if (courses.length === 0) {
    return <p className="text-sm text-text-3">{t("emptyState")}</p>;
  }

  async function loadStats(courseId: string): Promise<void> {
    setStatsById((prev) => ({ ...prev, [courseId]: { status: "loading" } }));
    try {
      const res = await fetch(`/api/teacher/courses/${courseId}/stats`);
      if (!res.ok) throw new Error("stats fetch failed");
      const stats = (await res.json()) as CourseStatsView;
      setStatsById((prev) => ({
        ...prev,
        [courseId]: { status: "loaded", stats },
      }));
    } catch {
      setStatsById((prev) => ({ ...prev, [courseId]: { status: "error" } }));
    }
  }

  function toggle(courseId: string): void {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });

    if (!statsById[courseId]) {
      void loadStats(courseId);
    }
  }

  return (
    <ul className="space-y-3">
      {courses.map((course) => {
        const isExpanded = expanded.has(course._id);
        const state = statsById[course._id];

        return (
          <li
            key={course._id}
            className="rounded-lg border border-border bg-card shadow-card"
          >
            <button
              type="button"
              onClick={() => toggle(course._id)}
              aria-expanded={isExpanded}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <span className="font-medium text-text">{course.title}</span>
              <CaretDown
                size={16}
                aria-hidden="true"
                className={cn(
                  "shrink-0 text-text-3 transition-transform",
                  isExpanded && "rotate-180"
                )}
              />
            </button>

            {isExpanded && (
              <div className="border-t border-border px-4 py-3">
                {!state || state.status === "loading" ? (
                  <p className="text-sm text-text-3">{t("statsLoading")}</p>
                ) : state.status === "error" ? (
                  <p className="text-sm text-danger">{t("statsError")}</p>
                ) : (
                  <dl className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <dt className="text-xs text-text-3">{t("enrolled")}</dt>
                      <dd className="text-lg font-bold text-text">
                        {state.stats.enrolledCount}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-text-3">
                        {t("completions")}
                      </dt>
                      <dd className="text-lg font-bold text-text">
                        {state.stats.completionCount}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-text-3">
                        {t("certificates")}
                      </dt>
                      <dd className="text-lg font-bold text-text">
                        {state.stats.certificateCount}
                      </dd>
                    </div>
                  </dl>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
