'use client';

import useSWR from 'swr';
import { sanityFetch } from '@/lib/sanity/client';
import {
  allCoursesQuery,
  featuredCoursesQuery,
  courseBySlugQuery,
  coursesByTrackQuery,
  lessonBySlugQuery,
  courseLessonsQuery,
  adjacentLessonsQuery,
  allTracksQuery,
  trackBySlugQuery,
  instructorBySlugQuery,
  allAchievementsQuery,
  searchQuery,
} from '@/lib/sanity/queries';
import type {
  SanityCourse,
  SanityLesson,
  SanityTrack,
  SanityInstructor,
  SanityAchievement,
  SanitySearchResult,
} from '@/lib/sanity/types';

// ==================== SWR Fetcher ====================

const fetcher = <T>(query: string, params?: Record<string, unknown>) =>
  sanityFetch<T>(query, params);

// ==================== Course Hooks ====================

/**
 * Fetch all published courses
 */
export function useCourses() {
  const { data, error, isLoading, mutate } = useSWR<SanityCourse[]>(
    ['courses', allCoursesQuery],
    () => fetcher<SanityCourse[]>(allCoursesQuery),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    courses: data,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Fetch featured courses
 */
export function useFeaturedCourses() {
  const { data, error, isLoading } = useSWR<SanityCourse[]>(
    ['featured-courses', featuredCoursesQuery],
    () => fetcher<SanityCourse[]>(featuredCoursesQuery),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    courses: data,
    isLoading,
    isError: error,
  };
}

/**
 * Fetch a single course by slug
 */
export function useCourse(slug: string | null) {
  const { data, error, isLoading } = useSWR<SanityCourse | null>(
    slug ? ['course', slug] : null,
    () => fetcher<SanityCourse>(courseBySlugQuery, { slug }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    course: data,
    isLoading,
    isError: error,
  };
}

/**
 * Fetch courses by track slug
 */
export function useCoursesByTrack(trackSlug: string | null) {
  const { data, error, isLoading } = useSWR<SanityCourse[]>(
    trackSlug ? ['courses-by-track', trackSlug] : null,
    () => fetcher<SanityCourse[]>(coursesByTrackQuery, { trackSlug }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    courses: data,
    isLoading,
    isError: error,
  };
}

// ==================== Lesson Hooks ====================

/**
 * Fetch a single lesson by slug
 */
export function useLesson(courseSlug: string | null, lessonSlug: string | null) {
  const { data, error, isLoading } = useSWR<SanityLesson | null>(
    courseSlug && lessonSlug ? ['lesson', courseSlug, lessonSlug] : null,
    () => fetcher<SanityLesson>(lessonBySlugQuery, { courseSlug, lessonSlug }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    lesson: data,
    isLoading,
    isError: error,
  };
}

/**
 * Fetch all lessons for a course
 */
export function useCourseLessons(courseSlug: string | null) {
  const { data, error, isLoading } = useSWR<SanityLesson[]>(
    courseSlug ? ['course-lessons', courseSlug] : null,
    () => fetcher<SanityLesson[]>(courseLessonsQuery, { courseSlug }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    lessons: data,
    isLoading,
    isError: error,
  };
}

/**
 * Fetch adjacent (previous/next) lessons
 */
export function useAdjacentLessons(courseSlug: string | null, currentOrder: number | null) {
  const { data, error, isLoading } = useSWR<{
    previous: Pick<SanityLesson, '_id' | 'title' | 'slug'> | null;
    next: Pick<SanityLesson, '_id' | 'title' | 'slug'> | null;
  }>(
    courseSlug && currentOrder !== null ? ['adjacent-lessons', courseSlug, currentOrder] : null,
    () => fetcher(adjacentLessonsQuery, { courseSlug, currentOrder }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    previousLesson: data?.previous,
    nextLesson: data?.next,
    isLoading,
    isError: error,
  };
}

// ==================== Track Hooks ====================

/**
 * Fetch all tracks
 */
export function useTracks() {
  const { data, error, isLoading } = useSWR<SanityTrack[]>(
    ['tracks', allTracksQuery],
    () => fetcher<SanityTrack[]>(allTracksQuery),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    tracks: data,
    isLoading,
    isError: error,
  };
}

/**
 * Fetch a single track by slug with its courses
 */
export function useTrack(slug: string | null) {
  const { data, error, isLoading } = useSWR<SanityTrack | null>(
    slug ? ['track', slug] : null,
    () => fetcher<SanityTrack>(trackBySlugQuery, { slug }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    track: data,
    isLoading,
    isError: error,
  };
}

// ==================== Instructor Hooks ====================

/**
 * Fetch an instructor by slug
 */
export function useInstructor(slug: string | null) {
  const { data, error, isLoading } = useSWR<SanityInstructor | null>(
    slug ? ['instructor', slug] : null,
    () => fetcher<SanityInstructor>(instructorBySlugQuery, { slug }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    instructor: data,
    isLoading,
    isError: error,
  };
}

// ==================== Achievement Hooks ====================

/**
 * Fetch all achievements
 */
export function useAchievements() {
  const { data, error, isLoading } = useSWR<SanityAchievement[]>(
    ['achievements', allAchievementsQuery],
    () => fetcher<SanityAchievement[]>(allAchievementsQuery),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    achievements: data,
    isLoading,
    isError: error,
  };
}

// ==================== Search Hook ====================

/**
 * Search courses and lessons
 */
export function useSearch(searchTerm: string | null) {
  const { data, error, isLoading } = useSWR<SanitySearchResult[]>(
    searchTerm && searchTerm.length >= 2 ? ['search', searchTerm] : null,
    () => fetcher<SanitySearchResult[]>(searchQuery, { searchTerm }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    results: data,
    isLoading,
    isError: error,
  };
}

// ==================== Server-side Fetching Helpers ====================

/**
 * Server-side fetch all courses
 */
export async function fetchCourses(): Promise<SanityCourse[]> {
  return sanityFetch<SanityCourse[]>(allCoursesQuery);
}

/**
 * Server-side fetch featured courses
 */
export async function fetchFeaturedCourses(): Promise<SanityCourse[]> {
  return sanityFetch<SanityCourse[]>(featuredCoursesQuery);
}

/**
 * Server-side fetch course by slug
 */
export async function fetchCourse(slug: string): Promise<SanityCourse | null> {
  return sanityFetch<SanityCourse | null>(courseBySlugQuery, { slug });
}

/**
 * Server-side fetch lesson
 */
export async function fetchLesson(
  courseSlug: string,
  lessonSlug: string
): Promise<SanityLesson | null> {
  return sanityFetch<SanityLesson | null>(lessonBySlugQuery, { courseSlug, lessonSlug });
}

/**
 * Server-side fetch all tracks
 */
export async function fetchTracks(): Promise<SanityTrack[]> {
  return sanityFetch<SanityTrack[]>(allTracksQuery);
}

/**
 * Server-side fetch track by slug
 */
export async function fetchTrack(slug: string): Promise<SanityTrack | null> {
  return sanityFetch<SanityTrack | null>(trackBySlugQuery, { slug });
}
