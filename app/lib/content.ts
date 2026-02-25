/**
 * Content Data Layer
 *
 * This module provides a unified interface for fetching content, whether from
 * Sanity CMS (when configured via env vars) or from static mock data (default
 * for local development and demo deployments).
 *
 * Usage:
 *   import { getCourses, getCourseBySlug, getLeaderboard } from '@/lib/content';
 *
 * To enable Sanity:
 *   Set NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET in .env.local
 */

import { sanityFetch, isSanityConfigured, QUERIES } from './sanity';
import {
  type Course,
  type LeaderboardUser,
  type MockCertificate,
  MOCK_COURSES,
  MOCK_LEADERBOARD,
  MOCK_CERTIFICATES,
} from './mock-data';

export type { Course, LeaderboardUser, MockCertificate };

// ---------------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------------

/**
 * Returns all courses. Falls back to mock data when Sanity is not configured.
 */
export async function getCourses(): Promise<Course[]> {
  if (isSanityConfigured) {
    const courses = await sanityFetch<Course[]>(QUERIES.courses);
    if (courses && courses.length > 0) return courses;
  }
  return MOCK_COURSES;
}

/**
 * Returns a single course by slug. Falls back to mock data.
 */
export async function getCourseBySlug(slug: string): Promise<Course | null> {
  if (isSanityConfigured) {
    const course = await sanityFetch<Course>(QUERIES.courseBySlug, { slug });
    if (course) return course;
  }
  return MOCK_COURSES.find((c) => c.slug === slug) ?? null;
}

/**
 * Returns courses filtered by track.
 */
export async function getCoursesByTrack(track: string): Promise<Course[]> {
  const courses = await getCourses();
  return courses.filter((c) => c.track === track);
}

/**
 * Returns courses filtered by level.
 */
export async function getCoursesByLevel(
  level: 'beginner' | 'intermediate' | 'advanced',
): Promise<Course[]> {
  const courses = await getCourses();
  return courses.filter((c) => c.level === level);
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

export async function getLeaderboard(limit = 50): Promise<LeaderboardUser[]> {
  if (isSanityConfigured) {
    const users = await sanityFetch<LeaderboardUser[]>(QUERIES.leaderboard);
    if (users && users.length > 0) return users.slice(0, limit);
  }
  return MOCK_LEADERBOARD.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Certificates
// ---------------------------------------------------------------------------

export async function getCertificates(
  walletAddress?: string,
): Promise<MockCertificate[]> {
  // Future: fetch from on-chain program or Sanity by walletAddress
  return MOCK_CERTIFICATES;
}

export async function getCertificateById(
  id: string,
): Promise<MockCertificate | null> {
  return MOCK_CERTIFICATES.find((c) => c.id === id) ?? null;
}

// ---------------------------------------------------------------------------
// Content source indicator (useful for debugging)
// ---------------------------------------------------------------------------

export const contentSource = isSanityConfigured ? 'sanity' : 'mock';
