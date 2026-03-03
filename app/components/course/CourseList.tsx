/**
 * CourseList — Responsive course grid with loading and empty states.
 * 1-col mobile, 2-col tablet, 3-col desktop. Passes index for color cycling.
 */
'use client';

import { CourseCard } from './CourseCard';
import { CourseListSkeleton } from './CourseCardSkeleton';
import { CoursesEmptyState } from './CoursesEmptyState';
import type { Course } from '@/context/types/course';

interface CourseListProps {
    courses: Course[];
    loading?: boolean;
    onCourseClick?: (course: Course) => void;
}

export function CourseList({ courses, loading, onCourseClick }: CourseListProps) {
    if (loading) {
        return <CourseListSkeleton count={6} />;
    }

    if (courses.length === 0) {
        return <CoursesEmptyState />;
    }

    return (
        <div
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
            role="list"
            aria-label="Course list"
        >
            {courses.map((course, index) => (
                <div key={course.courseId} role="listitem">
                    <CourseCard
                        course={course}
                        index={index}
                        onClick={() => onCourseClick?.(course)}
                    />
                </div>
            ))}
        </div>
    );
}
