import type { Course, Module, Lesson } from "@/lib/course-catalog";

/**
 * Sanity document type for a lesson within a module.
 *
 * Sanity Studio schema (for reference):
 *   name: "lesson"
 *   type: "object"
 *   fields:
 *     - { name: "id", type: "string" }
 *     - { name: "title", type: "string" }
 *     - { name: "type", type: "string", options: { list: ["video", "reading", "challenge"] } }
 *     - { name: "duration", type: "string" }
 *     - { name: "content", type: "markdown" }
 *     - { name: "starterCode", type: "text" }
 *     - { name: "testCases", type: "array", of: [{ type: "text" }] }
 *     - { name: "hints", type: "array", of: [{ type: "text" }] }
 *     - { name: "solution", type: "text" }
 */
export type SanityLesson = {
  id: string;
  title: string;
  type: "video" | "reading" | "challenge";
  duration: string;
  content?: string;
  starterCode?: string;
  testCases?: string[];
  hints?: string[];
  solution?: string;
};

/**
 * Sanity document type for a module within a course.
 *
 * Sanity Studio schema (for reference):
 *   name: "module"
 *   type: "object"
 *   fields:
 *     - { name: "title", type: "string" }
 *     - { name: "order", type: "number" }
 *     - { name: "lessons", type: "array", of: [{ type: "lesson" }] }
 */
export type SanityModule = {
  title: string;
  order: number;
  lessons: SanityLesson[];
};

/**
 * Sanity document type for a course.
 *
 * Sanity Studio schema (for reference):
 *   name: "course"
 *   type: "document"
 *   fields:
 *     - { name: "title", type: "string" }
 *     - { name: "slug", type: "slug" }
 *     - { name: "description", type: "text" }
 *     - { name: "instructor", type: "string" }
 *     - { name: "instructorAvatar", type: "string" }
 *     - { name: "difficulty", type: "string", options: { list: ["Beginner", "Intermediate", "Advanced"] } }
 *     - { name: "duration", type: "string" }
 *     - { name: "xp", type: "number" }
 *     - { name: "rating", type: "number" }
 *     - { name: "tags", type: "array", of: [{ type: "string" }] }
 *     - { name: "thumbnail", type: "image" }
 *     - { name: "modules", type: "array", of: [{ type: "module" }] }
 */
export type SanityCourse = {
  _id: string;
  title: string;
  slug: { current: string };
  description: string;
  instructor: string;
  instructorAvatar: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  xp: number;
  rating: number;
  tags: string[];
  thumbnail?: { asset?: { url?: string } };
  modules: SanityModule[];
};

function sanityLessonToLocal(lesson: SanityLesson): Lesson {
  return {
    id: lesson.id,
    title: lesson.title,
    type: lesson.type,
    duration: lesson.duration,
    completed: false,
  };
}

function sanityModuleToLocal(mod: SanityModule): Module {
  const lessons = (mod.lessons ?? []).map(sanityLessonToLocal);
  return {
    title: mod.title,
    lessons,
  };
}

export function sanityCourseToLocal(sc: SanityCourse): Course {
  const modules = (sc.modules ?? [])
    .sort((a, b) => a.order - b.order)
    .map(sanityModuleToLocal);

  const totalLessons = modules.reduce(
    (acc, mod) => acc + mod.lessons.length,
    0,
  );

  const thumbnailUrl = sc.thumbnail?.asset?.url ?? "/placeholder.jpg";

  return {
    slug: sc.slug.current,
    title: sc.title,
    description: sc.description,
    instructor: sc.instructor,
    instructorAvatar: sc.instructorAvatar,
    difficulty: sc.difficulty,
    duration: sc.duration,
    lessons: totalLessons,
    modules,
    rating: sc.rating,
    enrolled: 0,
    tags: sc.tags ?? [],
    progress: 0,
    xp: sc.xp,
    thumbnail: thumbnailUrl,
  };
}
