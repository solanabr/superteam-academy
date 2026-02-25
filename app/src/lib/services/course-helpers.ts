import type { Course, Lesson, CodeChallenge, TestCase } from "./types";
import { sanityClient, isSanityConfigured } from "@/lib/sanity";
import { allCoursesQuery, courseBySlugQuery } from "@/lib/sanity";
import { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "@/lib/env";
import { courses } from "./curriculum-data";

export function getCourseBySlug(slug: string): Course | undefined {
  return courses.find((c) => c.slug === slug);
}

export function getCourseById(id: string): Course | undefined {
  return courses.find((c) => c.id === id);
}

/* ------------------------------------------------------------------ */
/*  Raw response shapes for Sanity and Supabase                       */
/* ------------------------------------------------------------------ */

interface SanityLessonRaw {
  _id?: string;
  slug?: string;
  title: string;
  type?: string;
  estimatedMinutes?: number;
  xpReward?: number;
}

interface SanityModuleRaw {
  _id: string;
  title: string;
  lessons?: SanityLessonRaw[];
}

interface SanityCourseRaw {
  _id: string;
  slug: string;
  title: string;
  description: string;
  track: string;
  difficulty: string;
  lessonCount?: number;
  estimatedHours?: number;
  xpReward?: number;
  instructor?: { name?: string };
  modules?: SanityModuleRaw[];
}

interface SupabaseCourseRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  track: string;
  difficulty: string;
  lesson_count: number;
  duration: string;
  xp_reward: number;
  creator: string;
  image_url?: string | null;
  prerequisite_id?: string | null;
  is_active: boolean;
  total_completions: number;
  enrolled_count: number;
}

interface SupabaseModuleRow {
  id: string;
  course_id: string;
  title: string;
  order: number;
}

interface SupabaseLessonRow {
  id: string;
  module_id: string;
  title: string;
  type: string;
  duration: string;
  xp_reward: number;
  order: number;
  content?: string | null;
  challenge_instructions?: string | null;
  challenge_starter_code?: string;
  challenge_solution?: string;
  challenge_language?: string;
  challenge_test_cases?: TestCase[];
}

/* ------------------------------------------------------------------ */
/*  Sanity CMS integration — async fetchers with static-data fallback */
/* ------------------------------------------------------------------ */

function transformSanityCourse(raw: SanityCourseRaw): Course {
  return {
    id: raw._id,
    slug: raw.slug,
    title: raw.title,
    description: raw.description,
    track: raw.track as Course["track"],
    difficulty: raw.difficulty as Course["difficulty"],
    lessonCount: raw.lessonCount || 0,
    duration: raw.estimatedHours ? `${raw.estimatedHours} hours` : "0 hours",
    xpReward: raw.xpReward ?? 0,
    creator: raw.instructor?.name || "Superteam Academy",
    imageUrl: undefined,
    modules: (raw.modules || []).map((m) => ({
      id: m._id,
      title: m.title,
      lessons: (m.lessons || []).map((l) => ({
        id: l._id || l.slug || "",
        title: l.title,
        type:
          l.type === "challenge"
            ? "challenge"
            : l.type === "quiz"
              ? "quiz"
              : l.type === "video"
                ? "video"
                : "reading",
        duration: l.estimatedMinutes ? `${l.estimatedMinutes} min` : "10 min",
        xpReward: l.xpReward || 10,
      })),
    })),
    prerequisiteId: undefined,
    isActive: true,
    totalCompletions: 0,
    enrolledCount: 0,
  };
}

/* ------------------------------------------------------------------ */
/*  Supabase integration — reads from DB with static-data fallback      */
/* ------------------------------------------------------------------ */

function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function transformSupabaseCourse(
  row: SupabaseCourseRow,
  modules: SupabaseModuleRow[],
  lessons: SupabaseLessonRow[],
): Course {
  const courseModules = modules
    .filter((m) => m.course_id === row.id)
    .sort((a, b) => a.order - b.order);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    track: row.track as Course["track"],
    difficulty: row.difficulty as Course["difficulty"],
    lessonCount: row.lesson_count,
    duration: row.duration,
    xpReward: row.xp_reward,
    creator: row.creator,
    imageUrl: row.image_url ?? undefined,
    modules: courseModules.map((m) => ({
      id: m.id,
      title: m.title,
      lessons: lessons
        .filter((l) => l.module_id === m.id)
        .sort((a, b) => a.order - b.order)
        .map((l) => ({
          id: l.id,
          title: l.title,
          type: l.type as Lesson["type"],
          duration: l.duration,
          xpReward: l.xp_reward,
          content: l.content ?? undefined,
          challenge: l.challenge_instructions
            ? {
                instructions: l.challenge_instructions,
                starterCode: l.challenge_starter_code ?? "",
                solution: l.challenge_solution ?? "",
                language: (l.challenge_language ?? "typescript") as CodeChallenge["language"],
                testCases: l.challenge_test_cases ?? [],
              }
            : undefined,
        })),
    })),
    prerequisiteId: row.prerequisite_id ?? undefined,
    isActive: row.is_active,
    totalCompletions: row.total_completions,
    enrolledCount: row.enrolled_count,
  };
}

/**
 * Fetch all courses. Priority: Supabase > Sanity CMS > static data.
 */
export async function fetchCourses(): Promise<Course[]> {
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
      );
      const { data: dbCourses } = await supabase
        .from("courses")
        .select("*")
        .eq("published", true)
        .eq("is_active", true)
        .order("title");

      if (dbCourses && dbCourses.length > 0) {
        const { data: dbModules } = await supabase
          .from("modules")
          .select("*")
          .order("order");
        const { data: dbLessons } = await supabase
          .from("lessons")
          .select("*")
          .order("order");

        return (dbCourses as SupabaseCourseRow[]).map((row) =>
          transformSupabaseCourse(
            row,
            (dbModules ?? []) as SupabaseModuleRow[],
            (dbLessons ?? []) as SupabaseLessonRow[],
          ),
        );
      }
    } catch (error) {
      console.error("[courses] Supabase fetch failed, falling through:", error);
    }
  }

  // Try Sanity CMS
  if (isSanityConfigured()) {
    try {
      const raw = await sanityClient.fetch(allCoursesQuery);
      if (raw && raw.length > 0) return raw.map(transformSanityCourse);
    } catch (error) {
      console.error("[courses] Sanity fetch failed, falling through:", error);
    }
  }

  return courses;
}

/**
 * Fetch a single course by slug. Priority: Supabase > Sanity CMS > static data.
 */
export async function fetchCourseBySlug(
  slug: string,
): Promise<Course | undefined> {
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
      );
      const { data: row } = await supabase
        .from("courses")
        .select("*")
        .eq("slug", slug)
        .single();

      if (row) {
        const { data: dbModules } = await supabase
          .from("modules")
          .select("*")
          .eq("course_id", row.id)
          .order("order");
        const moduleIds = ((dbModules ?? []) as SupabaseModuleRow[]).map((m) => m.id);
        const { data: dbLessons } = await supabase
          .from("lessons")
          .select("*")
          .in("module_id", moduleIds.length > 0 ? moduleIds : ["__none__"])
          .order("order");

        return transformSupabaseCourse(
          row as SupabaseCourseRow,
          (dbModules ?? []) as SupabaseModuleRow[],
          (dbLessons ?? []) as SupabaseLessonRow[],
        );
      }
    } catch (error) {
      console.error("[courses] Supabase slug fetch failed, falling through:", error);
    }
  }

  // Try Sanity CMS
  if (isSanityConfigured()) {
    try {
      const raw = await sanityClient.fetch(courseBySlugQuery, { slug });
      if (raw) return transformSanityCourse(raw);
    } catch (error) {
      console.error("[courses] Sanity slug fetch failed, falling through:", error);
    }
  }

  return getCourseBySlug(slug);
}
