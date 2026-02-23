"use client";

import { CourseCard } from "@/components/course/course-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Course } from "@/types";

interface CourseGridProps {
  courses: Course[];
  loading?: boolean;
  enrolledCourseIds?: string[];
  pendingCourseId?: string;
  onEnroll?: (courseId: string) => Promise<void>;
}

export function CourseGrid({
  courses,
  loading,
  enrolledCourseIds = [],
  pendingCourseId,
  onEnroll,
}: CourseGridProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-72 rounded-xl bg-card" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          enrolled={enrolledCourseIds.includes(course.id)}
          enrollPending={pendingCourseId === course.id}
          onEnroll={onEnroll}
        />
      ))}
    </div>
  );
}
