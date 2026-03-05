/**
 * CMS Service Layer
 *
 * Provides a unified API for course, challenge, and instructor data.
 * Strategy:
 *   1. If NEXT_PUBLIC_SANITY_PROJECT_ID is set → fetch from Sanity CMS
 *   2. Otherwise → fall back to hardcoded data in src/data/
 *
 * Every async function catches Sanity errors and falls back gracefully.
 */

import type {
  Course,
  Module,
  Lesson,
  Difficulty,
  Duration,
  Exercise,
} from "@/data/courses";
import type {
  Challenge,
  ChallengeStatus,
  ChallengeDifficulty,
  ChallengeTrack,
} from "@/data/challenges";
import type { Instructor } from "@/data/instructors";
import { sanityClient, isSanityConfigured } from "@/sanity/client";
import {
  allCoursesQuery,
  courseBySlugQuery,
  allChallengesQuery,
  allInstructorsQuery,
} from "@/sanity/queries";

// ── Hardcoded fallback imports ─────────────────────────────────
import {
  courses as hardcodedCourses,
  getCourseBySlug as hcGetCourseBySlug,
  getCoursesByInstructorSlug as hcGetCoursesByInstructor,
  getLesson as hcGetLesson,
  getDifficultyLabel as hcGetDifficultyLabel,
  getDurationLabel as hcGetDurationLabel,
} from "@/data/courses";
import {
  challenges as hardcodedChallenges,
  getChallengesByStatus as hcGetChallengesByStatus,
  getChallengesByTrack as hcGetChallengesByTrack,
  getDifficultyLabel as hcGetChallengeDifficultyLabel,
} from "@/data/challenges";
import {
  getAllInstructors as hcGetAllInstructors,
  getInstructorBySlug as hcGetInstructorBySlug,
} from "@/data/instructors";
import {
  localize as hcLocalize,
  localizeLesson as hcLocalizeLesson,
} from "@/data/courses-i18n";

// ── Simple in-memory cache for Sanity results ──────────────────
let _coursesCache: { locale: string; data: Course[]; ts: number } | null = null;
const CACHE_TTL = 60_000; // 1 minute

function isCacheValid(
  cache: typeof _coursesCache,
  locale: string,
): cache is NonNullable<typeof _coursesCache> {
  return (
    cache !== null &&
    cache.locale === locale &&
    Date.now() - cache.ts < CACHE_TTL
  );
}

// ── Courses ────────────────────────────────────────────────────

export async function getAllCourses(locale = "pt"): Promise<Course[]> {
  if (!isSanityConfigured()) return hardcodedCourses;

  if (isCacheValid(_coursesCache, locale)) return _coursesCache.data;

  try {
    const data = await sanityClient!.fetch<Course[]>(allCoursesQuery(locale));
    if (data.length === 0) return hardcodedCourses;
    _coursesCache = { locale, data, ts: Date.now() };
    return data;
  } catch (err) {
    console.error("[CMS] Sanity courses fetch failed, using fallback:", err);
    return hardcodedCourses;
  }
}

export async function getCourseBySlug(
  slug: string,
  locale = "pt",
): Promise<Course | undefined> {
  if (!isSanityConfigured()) return hcGetCourseBySlug(slug);

  try {
    const course = await sanityClient!.fetch<Course | null>(
      courseBySlugQuery(locale),
      { slug },
    );
    return course ?? hcGetCourseBySlug(slug);
  } catch {
    return hcGetCourseBySlug(slug);
  }
}

export async function getCoursesByInstructorSlug(
  instructorSlug: string,
  locale = "pt",
): Promise<Course[]> {
  if (!isSanityConfigured()) return hcGetCoursesByInstructor(instructorSlug);

  const courses = await getAllCourses(locale);
  return courses.filter((c) => c.instructorSlug === instructorSlug);
}

export async function getLesson(
  courseSlug: string,
  lessonSlug: string,
  locale = "pt",
): Promise<{ course: Course; module: Module; lesson: Lesson } | null> {
  if (!isSanityConfigured()) return hcGetLesson(courseSlug, lessonSlug);

  const course = await getCourseBySlug(courseSlug, locale);
  if (!course) return null;

  for (const mod of course.modules) {
    const lesson = mod.lessons.find((l) => l.slug === lessonSlug);
    if (lesson) return { course, module: mod, lesson };
  }
  return null;
}

// ── Challenges ─────────────────────────────────────────────────

export async function getAllChallenges(locale = "pt"): Promise<Challenge[]> {
  if (!isSanityConfigured()) return hardcodedChallenges;

  try {
    const data = await sanityClient!.fetch<Challenge[]>(
      allChallengesQuery(locale),
    );
    if (data.length === 0) return hardcodedChallenges;
    return data;
  } catch {
    return hardcodedChallenges;
  }
}

export async function getChallengesByStatus(
  status: ChallengeStatus | "",
  locale = "pt",
): Promise<Challenge[]> {
  if (!isSanityConfigured()) return hcGetChallengesByStatus(status);

  const all = await getAllChallenges(locale);
  if (!status) return all;
  return all.filter((c) => c.status === status);
}

export async function getChallengesByTrack(
  track: string,
  locale = "pt",
): Promise<Challenge[]> {
  if (!isSanityConfigured()) return hcGetChallengesByTrack(track);

  const all = await getAllChallenges(locale);
  if (!track) return all;
  return all.filter((c) => c.track === track);
}

// ── Instructors ────────────────────────────────────────────────

export async function getAllInstructors(locale = "pt"): Promise<Instructor[]> {
  if (!isSanityConfigured()) return hcGetAllInstructors();

  try {
    const data = await sanityClient!.fetch<Instructor[]>(
      allInstructorsQuery(locale),
    );
    if (data.length === 0) return hcGetAllInstructors();
    return data;
  } catch {
    return hcGetAllInstructors();
  }
}

export async function getInstructorBySlug(
  slug: string,
  locale = "pt",
): Promise<Instructor | undefined> {
  if (!isSanityConfigured()) return hcGetInstructorBySlug(slug);

  const all = await getAllInstructors(locale);
  return all.find((i) => i.slug === slug);
}

// ── Utility functions (pure, no CMS dependency) ───────────────

export const getDifficultyLabel = hcGetDifficultyLabel;
export const getDurationLabel = hcGetDurationLabel;
export const getChallengeDifficultyLabel = hcGetChallengeDifficultyLabel;

// ── i18n helpers ───────────────────────────────────────────────
// When Sanity is active, GROQ queries already resolve the locale,
// so these become pass-throughs. Otherwise delegate to courses-i18n.

export function localize(
  locale: string,
  key: string,
  field: "title" | "description" | "longDescription",
  fallback: string,
): string {
  // Always try i18n lookup — works for both hardcoded fallback and Sanity data
  return hcLocalize(locale, key, field, fallback);
}

export function localizeLesson(locale: string, lesson: Lesson): Lesson {
  return hcLocalizeLesson(locale, lesson);
}

// ── Re-exports for type convenience ────────────────────────────

export type {
  Course,
  Module,
  Lesson,
  Exercise,
  Difficulty,
  Duration,
} from "@/data/courses";

export type {
  Challenge,
  ChallengeStatus,
  ChallengeTrack,
  ChallengeDifficulty,
} from "@/data/challenges";

export type { Instructor } from "@/data/instructors";
