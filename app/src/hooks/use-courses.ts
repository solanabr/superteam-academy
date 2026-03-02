"use client";

import { useQuery } from "@tanstack/react-query";
import { getServices } from "@/lib/services";
import type { CourseData } from "@/lib/services/types";

// ---------------------------------------------------------------------------
// Query key factory — keeps keys consistent and enables targeted invalidation
// ---------------------------------------------------------------------------

export const courseKeys = {
  all: ["courses"] as const,
  lists: () => [...courseKeys.all, "list"] as const,
  list: () => [...courseKeys.lists()] as const,
  byTrack: (trackId: number) => [...courseKeys.lists(), "track", trackId] as const,
  details: () => [...courseKeys.all, "detail"] as const,
  detail: (courseId: string) => [...courseKeys.details(), courseId] as const,
};

// CMS-sourced data: 5 minute stale time
const CMS_STALE_TIME = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Fetches the full list of active courses.
 */
export function useCourses() {
  return useQuery<CourseData[], Error>({
    queryKey: courseKeys.list(),
    queryFn: () => getServices().course.getCourses(),
    staleTime: CMS_STALE_TIME,
  });
}

/**
 * Fetches a single course by its string ID.
 * Disabled when courseId is empty.
 */
export function useCourse(courseId: string) {
  return useQuery<CourseData | null, Error>({
    queryKey: courseKeys.detail(courseId),
    queryFn: () => getServices().course.getCourse(courseId),
    staleTime: CMS_STALE_TIME,
    enabled: courseId.length > 0,
  });
}

/**
 * Fetches all courses belonging to a given track, ordered by track level.
 * Disabled when trackId is 0.
 */
export function useCoursesByTrack(trackId: number) {
  return useQuery<CourseData[], Error>({
    queryKey: courseKeys.byTrack(trackId),
    queryFn: () => getServices().course.getCoursesByTrack(trackId),
    staleTime: CMS_STALE_TIME,
    enabled: trackId > 0,
  });
}
