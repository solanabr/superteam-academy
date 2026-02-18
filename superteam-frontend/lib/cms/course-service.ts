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
    return structuredClone(await getAllCourses());
  }

  async getCourseBySlug(slug: string): Promise<Course | null> {
    const course = await getCourse(slug);
    return course ? structuredClone(course) : null;
  }

  async searchCourses(query: string): Promise<Course[]> {
    const lower = query.toLowerCase();
    const all = await getAllCourses();
    return structuredClone(
      all.filter(
        (c) =>
          c.title.toLowerCase().includes(lower) ||
          c.description.toLowerCase().includes(lower),
      ),
    );
  }

  async getCoursesByDifficulty(difficulty: string): Promise<Course[]> {
    const all = await getAllCourses();
    return structuredClone(
      all.filter(
        (c) => c.difficulty.toLowerCase() === difficulty.toLowerCase(),
      ),
    );
  }

  async getCoursesByTag(tag: string): Promise<Course[]> {
    const lower = tag.toLowerCase();
    const all = await getAllCourses();
    return structuredClone(
      all.filter((c) => c.tags.some((t) => t.toLowerCase() === lower)),
    );
  }
}

// ---------------------------------------------------------------------------
// Sanity-with-local-fallback: tries Sanity first, falls back to local store
// ---------------------------------------------------------------------------

class FallbackCourseService implements CourseService {
  private sanity = new SanityCourseService();
  private local = new LocalCourseService();

  async getAllCourses(): Promise<Course[]> {
    try {
      const results = await this.sanity.getAllCourses();
      if (results.length > 0) return results;
    } catch {}
    return this.local.getAllCourses();
  }

  async getCourseBySlug(slug: string): Promise<Course | null> {
    try {
      const result = await this.sanity.getCourseBySlug(slug);
      if (result) return result;
    } catch {}
    return this.local.getCourseBySlug(slug);
  }

  async searchCourses(query: string): Promise<Course[]> {
    try {
      const results = await this.sanity.searchCourses(query);
      if (results.length > 0) return results;
    } catch {}
    return this.local.searchCourses(query);
  }

  async getCoursesByDifficulty(difficulty: string): Promise<Course[]> {
    try {
      const results = await this.sanity.getCoursesByDifficulty(difficulty);
      if (results.length > 0) return results;
    } catch {}
    return this.local.getCoursesByDifficulty(difficulty);
  }

  async getCoursesByTag(tag: string): Promise<Course[]> {
    try {
      const results = await this.sanity.getCoursesByTag(tag);
      if (results.length > 0) return results;
    } catch {}
    return this.local.getCoursesByTag(tag);
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function getCourseService(): CourseService {
  if (isCmsConfigured()) {
    return new FallbackCourseService();
  }
  return new LocalCourseService();
}

export const courseService: CourseService = getCourseService();
