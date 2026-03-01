"use client";

import { useTranslations } from "next-intl";
import { CourseCard } from "./course-card";
import { EmptyState } from "@/components/ui/empty-state";
import { EmptyCoursesIllustration } from "@/components/icons";
import type { Course, Progress } from "@/types";

export interface CourseGridProps {
  courses: Course[];
  progressMap: Record<string, Progress>;
}

export function CourseGrid({ courses, progressMap }: CourseGridProps) {
  const t = useTranslations("courses");

  if (courses.length === 0) {
    return (
      <EmptyState
        illustration={<EmptyCoursesIllustration className="h-full w-full" />}
        title={t("catalog.noCourses")}
        description={t("catalog.noCoursesHint")}
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
      {courses.map((course) => (
        <CourseCard
          key={course.slug}
          course={course}
          progressPct={progressMap[course.slug]?.percentage ?? progressMap[course.id]?.percentage ?? 0}
        />
      ))}
    </div>
  );
}
