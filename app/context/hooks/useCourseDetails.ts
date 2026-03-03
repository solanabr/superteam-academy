/**
 * Hook for fetching course details.
 *
 * Primary source: Sanity CMS (via server-side API proxy)
 * Fallback: Arweave content (legacy — for courses not yet in Sanity)
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { useCourse } from './useCourses';
import { fetchCourseContent, contentTxIdToString } from '@/context/course/content';
import type { CourseWithDetails, SanityCourse } from '@/context/types/course';

/**
 * Fetch course + its off-chain content.
 *
 * Strategy:
 * 1. Try Sanity CMS lookup via server-side API proxy (avoids CORS)
 * 2. If no Sanity result, fall back to Arweave content (legacy)
 */
export function useCourseDetails(courseId: string | undefined) {
    const { data: course, isLoading: courseLoading } = useCourse(courseId);

    const contentQuery = useQuery({
        queryKey: ['courseContent', courseId],
        queryFn: async () => {
            if (!course || !courseId) return null;

            // Try Sanity via server-side API proxy (avoids CORS)
            try {
                const res = await fetch(`/api/cms/course?courseId=${encodeURIComponent(courseId)}`);
                if (res.ok) {
                    const { course: sanityCourse } = (await res.json()) as { course: SanityCourse | null };
                    if (sanityCourse) {
                        return {
                            title: sanityCourse.title,
                            description: sanityCourse.description,
                            thumbnail: sanityCourse.thumbnail
                                ? `sanity:${sanityCourse.thumbnail.asset._ref}`
                                : '',
                            lessons: sanityCourse.modules
                                .flatMap((m) => m.lessons)
                                .map((l, i) => ({
                                    index: i,
                                    title: l.title,
                                    contentTxId: l.slug.current,
                                    duration: l.duration,
                                    type: l.type,
                                    challenge: l.challenge,
                                    hints: l.hints,
                                    quiz: l.quiz
                                        ? {
                                            questions: l.quiz.questions.map((q, qi) => ({
                                                id: `q-${qi}`,
                                                question: q.question,
                                                options: q.options,
                                                correctIndex: q.correctIndex,
                                            })),
                                            passThreshold: l.quiz.passThreshold,
                                        }
                                        : undefined,
                                })),
                        };
                    }
                }
            } catch {
                // Sanity unavailable — fall through to Arweave
            }

            // Check if contentTxId is zeroed (no legacy Arweave content)
            const isZeroed = !course.contentTxId || course.contentTxId.every((b) => b === 0);

            if (isZeroed) {
                return null;
            }

            // Fallback to Arweave (legacy courses with real content tx ID)
            const contentTxId = contentTxIdToString(course.contentTxId);
            if (!contentTxId) return null;
            return fetchCourseContent(contentTxId);
        },
        enabled: !!course && !!courseId,
        staleTime: 300_000, // 5 minutes — content rarely changes
    });

    const courseWithDetails: CourseWithDetails | null =
        course && contentQuery.data
            ? {
                ...course,
                title: contentQuery.data.title,
                description: contentQuery.data.description,
                thumbnail: contentQuery.data.thumbnail,
                lessons: contentQuery.data.lessons,
            }
            : null;

    return {
        data: courseWithDetails,
        isLoading: courseLoading || contentQuery.isLoading,
        error: contentQuery.error,
    };
}
