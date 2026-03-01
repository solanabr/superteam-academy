'use client';

import { useEffect } from 'react';
import { useCourseStore } from '@/lib/stores/course-store';
import type { CourseWithMeta, CourseFilters, CourseState } from '@/lib/stores/course-store';
import { useUserStore } from '@/lib/stores/user-store';
import type { EnrollmentData } from '@/lib/stores/user-store';

interface UseCourseReturn {
  course: CourseWithMeta | null;
  enrollment: EnrollmentData | null;
  isEnrolled: boolean;
  isLoading: boolean;
}

/**
 * Selects a single course by ID and pairs it with the current user's
 * enrollment data for that course.
 *
 * When `courseId` is provided, the store's `selectCourse` is called on
 * mount and when the ID changes. If omitted, returns the currently
 * selected course (if any).
 */
export function useCourse(courseId?: string): UseCourseReturn {
  const selectCourse = useCourseStore((s) => s.selectCourse);
  const selectedCourse = useCourseStore((s) => s.selectedCourse);
  const courseLoading = useCourseStore((s) => s.isLoading);
  const coursesLength = useCourseStore((s) => s.courses.length);

  const enrollments = useUserStore((s) => s.enrollments);
  const userLoading = useUserStore((s) => s.isLoading);

  useEffect(() => {
    if (courseId) {
      selectCourse(courseId);
    }
  }, [courseId, selectCourse, coursesLength]);

  const enrollment = courseId
    ? enrollments.get(courseId) ?? null
    : selectedCourse
      ? enrollments.get(selectedCourse.courseId) ?? null
      : null;

  return {
    course: selectedCourse,
    enrollment,
    isEnrolled: enrollment !== null,
    isLoading: courseLoading || userLoading,
  };
}

// ---------------------------------------------------------------------------

interface UseCourseListReturn {
  courses: CourseWithMeta[];
  filteredCourses: CourseWithMeta[];
  filters: CourseFilters;
  setFilter: CourseState['setFilter'];
  resetFilters: () => void;
  isLoading: boolean;
}

/**
 * Provides the full course catalog from the course store with
 * filtering and sorting capabilities.
 *
 * `filteredCourses` recomputes on every render from the store's
 * `getFilteredCourses()` — this is intentional since Zustand selectors
 * won't detect changes to the computed output (it's a getter, not state).
 */
export function useCourseList(): UseCourseListReturn {
  const courses = useCourseStore((s) => s.courses);
  const filters = useCourseStore((s) => s.filters);
  const setFilter = useCourseStore((s) => s.setFilter);
  const resetFilters = useCourseStore((s) => s.resetFilters);
  const isLoading = useCourseStore((s) => s.isLoading);
  const getFilteredCourses = useCourseStore((s) => s.getFilteredCourses);

  // getFilteredCourses reads from store state internally — call it
  // on each render so filtered results stay in sync with filter changes.
  const filteredCourses = getFilteredCourses();

  return {
    courses,
    filteredCourses,
    filters,
    setFilter,
    resetFilters,
    isLoading,
  };
}
