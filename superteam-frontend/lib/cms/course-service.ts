import type { Course } from "@/lib/course-catalog";
import { getAllCourses, getCourse } from "@/lib/server/admin-store";
import {
  isCmsConfigured,
  getSanityClient,
  type SanityClientLike,
} from "@/lib/cms/sanity-client";
import {
  sanityCourseToLocal,
  type SanityCourse,
} from "@/lib/cms/sanity-schema";

export interface CourseService {
  getAllCourses(): Promise<Course[]>;
  getCourseBySlug(slug: string): Promise<Course | null>;
  searchCourses(query: string): Promise<Course[]>;
  getCoursesByDifficulty(difficulty: string): Promise<Course[]>;
  getCoursesByTag(tag: string): Promise<Course[]>;
}

// ---------------------------------------------------------------------------
// GROQ queries for Sanity
// ---------------------------------------------------------------------------

const COURSE_PROJECTION = `{
  _id,
  title,
  "slug": slug,
  description,
  instructor,
  instructorAvatar,
  difficulty,
  duration,
  xp,
  rating,
  tags,
  "thumbnail": thumbnail { asset-> { url } },
  "modules": modules[] | order(order asc) {
    title,
    order,
    lessons[] {
      id,
      title,
      type,
      duration,
      content,
      starterCode,
      testCases,
      hints,
      solution
    }
  }
}`;

const ALL_COURSES_QUERY = `*[_type == "course"] | order(title asc) ${COURSE_PROJECTION}`;

function courseBySlugQuery(slug: string): string {
  return `*[_type == "course" && slug.current == "${slug}"][0] ${COURSE_PROJECTION}`;
}

function searchCoursesQuery(query: string): string {
  return `*[_type == "course" && (title match "${query}*" || description match "${query}*")] | order(title asc) ${COURSE_PROJECTION}`;
}

function coursesByDifficultyQuery(difficulty: string): string {
  return `*[_type == "course" && difficulty == "${difficulty}"] | order(title asc) ${COURSE_PROJECTION}`;
}

function coursesByTagQuery(tag: string): string {
  return `*[_type == "course" && "${tag}" in tags] | order(title asc) ${COURSE_PROJECTION}`;
}

// ---------------------------------------------------------------------------
// Sanity implementation
// ---------------------------------------------------------------------------

async function requireClient(): Promise<SanityClientLike> {
  const client = await getSanityClient();
  if (!client) {
    throw new Error(
      "Sanity client unavailable. Install @sanity/client and set NEXT_PUBLIC_SANITY_PROJECT_ID + NEXT_PUBLIC_SANITY_DATASET.",
    );
  }
  return client;
}

class SanityCourseService implements CourseService {
  async getAllCourses(): Promise<Course[]> {
    const client = await requireClient();
    const results = await client.fetch<SanityCourse[]>(ALL_COURSES_QUERY);
    return results.map(sanityCourseToLocal);
  }

  async getCourseBySlug(slug: string): Promise<Course | null> {
    const client = await requireClient();
    const result = await client.fetch<SanityCourse | null>(
      courseBySlugQuery(slug),
    );
    return result ? sanityCourseToLocal(result) : null;
  }

  async searchCourses(query: string): Promise<Course[]> {
    const client = await requireClient();
    const results = await client.fetch<SanityCourse[]>(
      searchCoursesQuery(query),
    );
    return results.map(sanityCourseToLocal);
  }

  async getCoursesByDifficulty(difficulty: string): Promise<Course[]> {
    const client = await requireClient();
    const results = await client.fetch<SanityCourse[]>(
      coursesByDifficultyQuery(difficulty),
    );
    return results.map(sanityCourseToLocal);
  }

  async getCoursesByTag(tag: string): Promise<Course[]> {
    const client = await requireClient();
    const results = await client.fetch<SanityCourse[]>(coursesByTagQuery(tag));
    return results.map(sanityCourseToLocal);
  }
}

// ---------------------------------------------------------------------------
// Local (hardcoded data) implementation
// ---------------------------------------------------------------------------

class LocalCourseService implements CourseService {
  async getAllCourses(): Promise<Course[]> {
    return structuredClone(getAllCourses());
  }

  async getCourseBySlug(slug: string): Promise<Course | null> {
    const course = getCourse(slug);
    return course ? structuredClone(course) : null;
  }

  async searchCourses(query: string): Promise<Course[]> {
    const lower = query.toLowerCase();
    return structuredClone(
      getAllCourses().filter(
        (c) =>
          c.title.toLowerCase().includes(lower) ||
          c.description.toLowerCase().includes(lower),
      ),
    );
  }

  async getCoursesByDifficulty(difficulty: string): Promise<Course[]> {
    return structuredClone(
      getAllCourses().filter(
        (c) => c.difficulty.toLowerCase() === difficulty.toLowerCase(),
      ),
    );
  }

  async getCoursesByTag(tag: string): Promise<Course[]> {
    const lower = tag.toLowerCase();
    return structuredClone(
      getAllCourses().filter((c) =>
        c.tags.some((t) => t.toLowerCase() === lower),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function getCourseService(): CourseService {
  if (isCmsConfigured()) {
    return new SanityCourseService();
  }
  return new LocalCourseService();
}

export const courseService: CourseService = getCourseService();
