import { sanityFetch } from "./client";
import type { Course, Lesson, LearningPath } from "./types";

// --- GROQ Queries ---

const courseFields = `
  _id,
  title,
  "slug": slug.current,
  description,
  difficulty,
  duration,
  "thumbnail": thumbnail.asset->url,
  instructor->{
    name,
    "avatar": avatar.asset->url,
    bio,
    socialLinks
  },
  tags,
  xpReward
`;

const moduleWithLessonsFields = `
  _id,
  title,
  description,
  order,
  lessons[]->{
    _id,
    title,
    "slug": slug.current,
    type,
    language,
    buildType,
    deployable,
    widgets,
    programIdl,
    videoUrl,
    content,
    code,
    tests,
    hints,
    solution,
    xpReward,
    order
  } | order(order asc)
`;

// --- Query Functions ---

export async function getAllCourses(): Promise<Course[]> {
  return sanityFetch<Course[]>(
    `*[_type == "course"] | order(title asc) {
      ${courseFields},
      "modules": modules[]->{
        _id,
        title,
        description,
        order,
        "lessons": lessons[]->{
          _id,
          title,
          "slug": slug.current,
          type,
          xpReward,
          order
        } | order(order asc)
      } | order(order asc)
    }`
  );
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  return sanityFetch<Course | null>(
    `*[_type == "course" && slug.current == $slug][0] {
      ${courseFields},
      "modules": modules[]->{
        ${moduleWithLessonsFields}
      } | order(order asc)
    }`,
    { slug }
  );
}

export async function getLessonBySlug(
  courseSlug: string,
  lessonSlug: string
): Promise<Lesson | null> {
  return sanityFetch<Lesson | null>(
    `*[_type == "course" && slug.current == $courseSlug][0] {
      "allLessons": modules[]->lessons[]->{
        _id,
        title,
        "slug": slug.current,
        type,
        language,
        buildType,
        deployable,
        widgets,
        programIdl,
        videoUrl,
        content,
        code,
        tests,
        hints,
        solution,
        xpReward,
        order
      }
    }.allLessons[slug == $lessonSlug][0]`,
    { courseSlug, lessonSlug }
  );
}

export async function getAllLearningPaths(): Promise<LearningPath[]> {
  return sanityFetch<LearningPath[]>(
    `*[_type == "learningPath"] | order(title asc) {
      _id,
      title,
      description,
      "slug": slug.current,
      difficulty,
      "courses": courses[]->{
        ${courseFields},
        "modules": modules[]->{
          _id,
          title,
          description,
          order,
          "lessons": lessons[]->{
            _id,
            title,
            "slug": slug.current,
            type,
            xpReward,
            order
          } | order(order asc)
        } | order(order asc)
      }
    }`
  );
}

/**
 * Get a course's Sanity _id from its slug (lightweight, no content fetched).
 */
export async function getCourseIdBySlug(slug: string): Promise<string | null> {
  return sanityFetch<string | null>(
    `*[_type == "course" && slug.current == $slug][0]._id`,
    { slug }
  );
}

/**
 * Get all lessons for a course (flat list with slugs, used for lesson navigation).
 */
export async function getCourseLessons(
  courseSlug: string
): Promise<Pick<Lesson, "_id" | "title" | "slug" | "type">[]> {
  return sanityFetch<Pick<Lesson, "_id" | "title" | "slug" | "type">[]>(
    `*[_type == "course" && slug.current == $courseSlug][0] {
      "lessons": modules[]->lessons[]-> {
        _id,
        title,
        "slug": slug.current,
        type
      }
    }.lessons`,
    { courseSlug }
  );
}

// --- Dashboard & Profile Queries ---

export interface CourseSummary {
  _id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  tags: string[] | null;
  difficulty: string;
  totalLessons: number;
}

/**
 * Fetch course summaries by their Sanity _id values.
 * Used to resolve course titles/thumbnails for enrolled courses on the dashboard.
 */
export async function getCoursesByIds(ids: string[]): Promise<CourseSummary[]> {
  if (ids.length === 0) return [];
  return sanityFetch<CourseSummary[]>(
    `*[_type == "course" && _id in $ids] {
      _id,
      title,
      "slug": slug.current,
      "thumbnail": thumbnail.asset->url,
      tags,
      difficulty,
      "totalLessons": count(modules[]->lessons[])
    }`,
    { ids }
  );
}

export interface RecommendedCourse {
  _id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: string;
  duration: number;
  thumbnail: string | null;
  instructor: { name: string; avatar: string | null } | null;
  tags: string[] | null;
  xpReward: number;
  totalLessons: number;
}

/**
 * Fetch courses the user is NOT enrolled in, for the dashboard "Recommended" section.
 * Excludes courses whose _id is in the provided array.
 */
export async function getRecommendedCourses(
  excludeIds: string[]
): Promise<RecommendedCourse[]> {
  return sanityFetch<RecommendedCourse[]>(
    `*[_type == "course" && !(_id in $excludeIds)] | order(title asc) {
      _id,
      title,
      "slug": slug.current,
      description,
      difficulty,
      duration,
      "thumbnail": thumbnail.asset->url,
      instructor->{ name, "avatar": avatar.asset->url },
      tags,
      xpReward,
      "totalLessons": count(modules[]->lessons[])
    }`,
    { excludeIds }
  );
}

/**
 * Fetch all course tags from Sanity (used for profile skill radar).
 * Returns each course's _id, title, and tags array.
 */
export async function getAllCourseTags(): Promise<
  { _id: string; title: string; tags: string[] }[]
> {
  return sanityFetch<{ _id: string; title: string; tags: string[] }[]>(
    `*[_type == "course" && defined(tags)] {
      _id,
      title,
      tags
    }`
  );
}

/**
 * Fetch total lesson count per course (used for accurate course-completion detection).
 * Returns a map-friendly array of { _id, totalLessons }.
 */
export async function getAllCourseLessonCounts(): Promise<
  { _id: string; totalLessons: number }[]
> {
  return sanityFetch<{ _id: string; totalLessons: number }[]>(
    `*[_type == "course"] {
      _id,
      "totalLessons": count(modules[]->lessons[])
    }`
  );
}
