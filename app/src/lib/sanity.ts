import { createClient } from "@sanity/client";

/**
 * Sanity CMS Client Configuration
 * 
 * Set environment variables:
 * - NEXT_PUBLIC_SANITY_PROJECT_ID: Your Sanity project ID
 * - NEXT_PUBLIC_SANITY_DATASET: Dataset name (usually 'production')
 * - SANITY_API_TOKEN: Server-side API token for mutations
 */

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "demo-project";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const apiVersion = "2024-01-01";

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === "production",
});

// ── GROQ Queries ──

export const courseQueries = {
  /** Get all published courses */
  allCourses: `*[_type == "course" && !(_id in path("drafts.**"))] | order(order asc) {
    _id,
    title,
    slug,
    description,
    longDescription,
    difficulty,
    track,
    trackColor,
    courseId,
    duration,
    xpReward,
    xpPerLesson,
    lessonCount,
    enrolledCount,
    rating,
    prerequisites,
    objectives,
    tags,
    "thumbnail": thumbnail.asset->url,
    "instructor": instructor->{name, title, avatar, bio},
    "modules": modules[]->{
      _id,
      title,
      order,
      "lessons": lessons[]->{
        _id,
        title,
        type,
        duration,
        xpReward,
        "content": coalesce(content, ""),
        description,
        "challenge": challenge{
          language,
          starterCode,
          solution,
          prompt,
          objectives,
          hints,
          testCases[]{name, input, expected}
        }
      }
    }
  }`,

  /** Get a single course by slug */
  courseBySlug: `*[_type == "course" && slug.current == $slug && !(_id in path("drafts.**"))][0] {
    _id,
    title,
    "slug": slug.current,
    description,
    longDescription,
    difficulty,
    track,
    trackColor,
    courseId,
    duration,
    xpReward,
    xpPerLesson,
    lessonCount,
    enrolledCount,
    rating,
    prerequisites,
    objectives,
    tags,
    "thumbnail": thumbnail.asset->url,
    "instructor": instructor->{name, title, avatar, bio},
    "modules": modules[]->{
      _id,
      title,
      order,
      "lessons": lessons[]->{
        _id,
        title,
        type,
        duration,
        xpReward,
        "content": coalesce(content, ""),
        description,
        "challenge": challenge{
          language,
          starterCode,
          solution,
          prompt,
          objectives,
          hints,
          testCases[]{name, input, expected}
        }
      }
    }
  }`,

  /** Get course count by difficulty */
  courseStats: `{
    "total": count(*[_type == "course" && !(_id in path("drafts.**"))]),
    "beginner": count(*[_type == "course" && difficulty == "beginner" && !(_id in path("drafts.**"))]),
    "intermediate": count(*[_type == "course" && difficulty == "intermediate" && !(_id in path("drafts.**"))]),
    "advanced": count(*[_type == "course" && difficulty == "advanced" && !(_id in path("drafts.**"))])
  }`,
};

// ── Sanity Schema Definitions (for reference) ──

export const sanitySchemas = {
  course: {
    name: "course",
    title: "Course",
    type: "document",
    fields: [
      { name: "title", type: "string" },
      { name: "slug", type: "slug", options: { source: "title" } },
      { name: "description", type: "text" },
      { name: "longDescription", type: "text" },
      { name: "difficulty", type: "string", options: { list: ["beginner", "intermediate", "advanced"] } },
      { name: "track", type: "string" },
      { name: "trackColor", type: "string" },
      { name: "courseId", type: "string" },
      { name: "duration", type: "number" },
      { name: "xpReward", type: "number" },
      { name: "xpPerLesson", type: "number" },
      { name: "lessonCount", type: "number" },
      { name: "enrolledCount", type: "number" },
      { name: "rating", type: "number" },
      { name: "prerequisites", type: "array", of: [{ type: "string" }] },
      { name: "objectives", type: "array", of: [{ type: "string" }] },
      { name: "tags", type: "array", of: [{ type: "string" }] },
      { name: "thumbnail", type: "image" },
      { name: "instructor", type: "reference", to: [{ type: "instructor" }] },
      { name: "modules", type: "array", of: [{ type: "reference", to: [{ type: "module" }] }] },
      { name: "order", type: "number" },
    ],
  },
  module: {
    name: "module",
    title: "Module",
    type: "document",
    fields: [
      { name: "title", type: "string" },
      { name: "order", type: "number" },
      { name: "lessons", type: "array", of: [{ type: "reference", to: [{ type: "lesson" }] }] },
    ],
  },
  lesson: {
    name: "lesson",
    title: "Lesson",
    type: "document",
    fields: [
      { name: "title", type: "string" },
      { name: "type", type: "string", options: { list: ["reading", "video", "challenge", "quiz"] } },
      { name: "content", type: "text" },
      { name: "description", type: "text" },
      { name: "duration", type: "number" },
      { name: "xpReward", type: "number" },
      { name: "challenge", type: "object" },
    ],
  },
  instructor: {
    name: "instructor",
    title: "Instructor",
    type: "document",
    fields: [
      { name: "name", type: "string" },
      { name: "title", type: "string" },
      { name: "bio", type: "text" },
      { name: "avatar", type: "image" },
    ],
  },
};

/**
 * Fetch courses from Sanity CMS. Falls back to mock data if CMS is not configured.
 */
export async function fetchCoursesFromCMS() {
  if (projectId === "demo-project") {
    // CMS not configured — use mock data
    return null;
  }

  try {
    const courses = await sanityClient.fetch(courseQueries.allCourses);
    return courses;
  } catch (error) {
    console.warn("Failed to fetch from Sanity CMS, using mock data:", error);
    return null;
  }
}

export async function fetchCourseBySlugFromCMS(slug: string) {
  if (projectId === "demo-project") return null;

  try {
    return await sanityClient.fetch(courseQueries.courseBySlug, { slug });
  } catch (error) {
    console.warn("Failed to fetch course from CMS:", error);
    return null;
  }
}
