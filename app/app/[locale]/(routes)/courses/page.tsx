/**
 * Course Catalog page — /courses
 *
 * Displays all active courses with search, track/difficulty/status/sort filters.
 * All UI elements are extracted into reusable components.
 * Skeleton loading states shown while data loads.
 * Fully responsive: optimized for mobile, tablet, and desktop.
 *
 * Layout provides sidebar + topbar — no inline navigation needed.
 */
'use client';

import { useState, useMemo } from 'react';
import { useActiveCourses } from '@/context/hooks/useCourses';
import { getTrackName } from '@/context/course/tracks';
import { CoursesPageHeader } from '@/components/course/CoursesPageHeader';
import { CourseSearchBar } from '@/components/course/CourseSearchBar';
import { CourseFilters, type CourseStatus, type SortOption } from '@/components/course/CourseFilters';
import { CourseList } from '@/components/course/CourseList';
import { CourseFiltersSkeleton } from '@/components/course/CourseFiltersSkeleton';
import { CoursesErrorState } from '@/components/course/CoursesErrorState';
import { DIFFICULTY_LABELS, type Difficulty } from '@/context/types/course';

export default function CoursesPage() {
    const { data: courses, isLoading, error } = useActiveCourses();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTrack, setSelectedTrack] = useState<number | null>(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<CourseStatus>('all');
    const [selectedSort, setSelectedSort] = useState<SortOption>('relevance');

    const filteredCourses = useMemo(() => {
        if (!courses) return [];

        const query = searchQuery.toLowerCase().trim();

        let result = courses.filter((course) => {
            // Search filter — matches courseId, track name, difficulty label
            if (query) {
                const trackName = getTrackName(course.trackId).toLowerCase();
                const difficultyLabel = DIFFICULTY_LABELS[course.difficulty]?.toLowerCase() ?? '';
                const courseId = course.courseId.toLowerCase();
                const totalXp = String(course.xpPerLesson * course.lessonCount);

                const matches =
                    courseId.includes(query) ||
                    trackName.includes(query) ||
                    difficultyLabel.includes(query) ||
                    totalXp.includes(query);

                if (!matches) return false;
            }

            // Track filter
            if (selectedTrack !== null && course.trackId !== selectedTrack) {
                return false;
            }
            // Difficulty filter
            if (selectedDifficulty !== null && course.difficulty !== selectedDifficulty) {
                return false;
            }
            return true;
        });

        // Sorting
        switch (selectedSort) {
            case 'newest':
                result = [...result].reverse();
                break;
            case 'popular':
                result = [...result].sort((a, b) => b.totalEnrollments - a.totalEnrollments);
                break;
            case 'xp_high':
                result = [...result].sort((a, b) => (b.xpPerLesson * b.lessonCount) - (a.xpPerLesson * a.lessonCount));
                break;
            case 'xp_low':
                result = [...result].sort((a, b) => (a.xpPerLesson * a.lessonCount) - (b.xpPerLesson * b.lessonCount));
                break;
            default:
                break;
        }

        return result;
    }, [courses, searchQuery, selectedTrack, selectedDifficulty, selectedStatus, selectedSort]);

    return (
        <div className="max-w-[1400px] mx-auto min-w-0">
            <CoursesPageHeader
                title="Learn Solana"
                accentWord="Development"
                subtitle="Master blockchain development with on-chain credentials and XP rewards. Complete courses, earn XP, and build your developer portfolio."
            />

            {error ? (
                <CoursesErrorState />
            ) : isLoading ? (
                <>
                    <CourseFiltersSkeleton />
                    <CourseList courses={[]} loading />
                </>
            ) : (
                <>
                    <CourseSearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        resultCount={searchQuery ? filteredCourses.length : undefined}
                    />
                    <CourseFilters
                        selectedTrack={selectedTrack}
                        selectedDifficulty={selectedDifficulty}
                        selectedStatus={selectedStatus}
                        selectedSort={selectedSort}
                        onTrackChange={setSelectedTrack}
                        onDifficultyChange={setSelectedDifficulty}
                        onStatusChange={setSelectedStatus}
                        onSortChange={setSelectedSort}
                        courseCount={filteredCourses.length}
                    />
                    <CourseList courses={filteredCourses} />
                </>
            )}
        </div>
    );
}
