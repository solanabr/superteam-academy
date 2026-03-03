/**
 * useChallenges — aggregates all challenge-type lessons across active courses.
 *
 * Fetches courses from the API, then fetches Sanity CMS content for each,
 * filtering to lessons with type === 'challenge'.
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { useActiveCourses } from './useCourses';
import type { Difficulty, SanityCourse } from '@/context/types/course';

/** A single challenge item surfaced from course lessons */
export interface ChallengeItem {
    courseId: string;
    courseTitle: string;
    lessonIndex: number;
    lessonTitle: string;
    language: string;
    instructions: string;
    difficulty: Difficulty;
    xpReward: number;
    /** Pre-built URL to the lesson page */
    linkHref: string;
}

/**
 * Fetch all challenge-type lessons across active courses.
 */
export function useChallenges() {
    const { data: courses, isLoading: coursesLoading } = useActiveCourses();

    const challengesQuery = useQuery<ChallengeItem[]>({
        queryKey: ['challenges', courses?.map((c) => c.courseId)],
        queryFn: async () => {
            if (!courses || courses.length === 0) return [];

            const allChallenges: ChallengeItem[] = [];

            // Fetch Sanity content for each course via server-side API proxy
            await Promise.all(
                courses.map(async (course) => {
                    try {
                        const res = await fetch(`/api/cms/course?courseId=${encodeURIComponent(course.courseId)}`);
                        if (!res.ok) return;
                        const { course: sanityCourse } = (await res.json()) as { course: SanityCourse | null };
                        if (!sanityCourse) return;

                        const lessons = sanityCourse.modules.flatMap((m) => m.lessons);
                        let lessonGlobalIndex = 0;

                        for (const lesson of lessons) {
                            if (lesson.type === 'challenge' && lesson.challenge) {
                                allChallenges.push({
                                    courseId: course.courseId,
                                    courseTitle: sanityCourse.title,
                                    lessonIndex: lessonGlobalIndex,
                                    lessonTitle: lesson.title,
                                    language: lesson.challenge.language,
                                    instructions: lesson.challenge.instructions,
                                    difficulty: course.difficulty,
                                    xpReward: lesson.xpReward || course.xpPerLesson,
                                    linkHref: `/courses/${course.courseId}/lessons/${lessonGlobalIndex}`,
                                });
                            }
                            lessonGlobalIndex++;
                        }
                    } catch {
                        // Skip courses that fail to load from Sanity
                    }
                })
            );

            return allChallenges;
        },
        enabled: !!courses && courses.length > 0,
        staleTime: 300_000, // 5 minutes
    });

    return {
        data: challengesQuery.data ?? [],
        isLoading: coursesLoading || challengesQuery.isLoading,
        error: challengesQuery.error,
    };
}
