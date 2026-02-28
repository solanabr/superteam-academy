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
  type MockLearner,
  type MockCertificate,
  MOCK_COURSES,
  MOCK_LEADERBOARD,
  MOCK_CERTIFICATES,
} from './mock-data';

export type LeaderboardUser = MockLearner;
export type { Course, MockCertificate };

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


// ---------------------------------------------------------------------------
// Featured Courses (for landing page — returns i18n-aware shape)
// ---------------------------------------------------------------------------

interface FeaturedCourse {
  slug: string;
  title: Record<string, string>;
  level: string;
  xp: number;
  lessons: number;
  track: string;
  color: string;
  students: number;
  rating: number;
}

const RATING_MAP: Record<string, number> = {
  'intro-solana': 4.9,
  'anchor-basics': 4.8,
  'defi-solana': 4.7,
  'nft-solana': 4.6,
  'token-extensions': 4.5,
};

/**
 * Returns featured courses from Sanity CMS with i18n titles.
 * Falls back to null if CMS is not configured or data is missing.
 */
export async function getFeaturedCourses(): Promise<FeaturedCourse[] | null> {
  if (!isSanityConfigured) return null;

  const raw = await sanityFetch<Array<{
    slug: string;
    title: string;
    title_ptBR?: string;
    title_en?: string;
    title_es?: string;
    level: string;
    xp_reward: number;
    lesson_count: number;
    track: string;
    thumbnail_color?: string;
    enrollments?: number;
  }>>(QUERIES.courses);

  if (!raw || raw.length === 0) return null;

  return raw.slice(0, 3).map((c) => ({
    slug: c.slug,
    title: {
      'pt-BR': c.title_ptBR || c.title,
      en: c.title_en || c.title,
      es: c.title_es || c.title,
    },
    level: c.level,
    xp: c.xp_reward,
    lessons: c.lesson_count,
    track: c.track,
    color: c.thumbnail_color || 'from-purple-600 to-indigo-600',
    students: c.enrollments || 0,
    rating: RATING_MAP[c.slug] ?? 4.5,
  }));
}
