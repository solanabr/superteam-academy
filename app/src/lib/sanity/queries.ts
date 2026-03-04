import { publicClient } from "./client";

// Types
export type PortableTextContent = Array<{ _type: string; _key: string; [key: string]: unknown }>;

export interface SanityModule {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  order: number;
  lessons?: SanityLesson[];
}

export interface SanityCourse {
  _id: string;
  title: string;
  slug: string; // GROQ projects slug.current as flat string
  description: string;
  thumbnail?: { asset: { url: string } };
  difficulty: 1 | 2 | 3;
  trackId: number;
  onChainCourseId: string;
  xpPerLesson: number;
  xpPerCourseCompletion?: number;
  tags: string[];
  prerequisites: string[];
  instructor?: SanityInstructor;
  modules?: SanityModule[];
  lessons: SanityLesson[];
  status: "draft" | "published";
  locale: string;
}

export interface SanityLesson {
  _id: string;
  title: string;
  slug: string; // GROQ projects slug.current as flat string
  lessonIndex: number;
  content: PortableTextContent; // Portable Text
  videoUrl?: string;
  estimatedMinutes: number;
  challenge?: SanityChallenge;
}

export interface SanityChallenge {
  _id: string;
  title: string;
  language: "ts" | "rust" | "json";
  starterCode: string;
  solutionCode: string;
  testCode: string;
  hints: string[];
  difficulty: 1 | 2 | 3;
  xpReward?: number;
}

export interface SanityInstructor {
  _id: string;
  name: string;
  avatar?: { asset: { url: string } };
  bio: string;
  socialLinks: { platform: string; url: string }[];
  walletAddress?: string;
}

// Queries
const courseFields = `
  _id,
  title,
  "slug": slug.current,
  description,
  thumbnail { asset-> { url } },
  difficulty,
  trackId,
  onChainCourseId,
  xpPerLesson,
  xpPerCourseCompletion,
  tags,
  prerequisites,
  instructor-> {
    _id, name, avatar { asset-> { url } }, bio, socialLinks, walletAddress
  },
  "modules": modules[]-> {
    _id,
    title,
    "slug": slug.current,
    description,
    order,
    "lessons": lessons[]-> {
      _id,
      title,
      "slug": slug.current,
      lessonIndex,
      estimatedMinutes,
      videoUrl,
      challenge-> {
        _id, title, language, starterCode, solutionCode, testCode, hints, difficulty, xpReward
      }
    } | order(lessonIndex asc)
  } | order(order asc),
  "lessons": lessons[]-> {
    _id,
    title,
    "slug": slug.current,
    lessonIndex,
    estimatedMinutes,
    videoUrl,
    challenge-> {
      _id, title, language, starterCode, solutionCode, testCode, hints, difficulty
    }
  } | order(lessonIndex asc),
  status,
  locale
`;

export async function getAllCourses(locale = "pt-BR"): Promise<SanityCourse[]> {
  return publicClient.fetch(
    `*[_type == "course" && status == "published" && locale == $locale] { ${courseFields} }`,
    { locale }
  );
}

export async function getCourseBySlug(slug: string, locale = "pt-BR"): Promise<SanityCourse | null> {
  return publicClient.fetch(
    `*[_type == "course" && slug.current == $slug && locale == $locale][0] { ${courseFields} }`,
    { slug, locale }
  );
}

const lessonFields = `
  _id,
  title,
  "slug": slug.current,
  lessonIndex,
  content,
  videoUrl,
  estimatedMinutes,
  challenge-> {
    _id, title, language, starterCode, solutionCode, testCode, hints, difficulty, xpReward
  }
`;

export async function getLessonBySlug(courseSlug: string, lessonSlug: string, locale = "pt-BR"): Promise<SanityLesson | null> {
  // Search both flat lessons[] and module-nested modules[].lessons[]
  return publicClient.fetch(
    `coalesce(
      *[_type == "course" && slug.current == $courseSlug && locale == $locale][0]
        .lessons[@->slug.current == $lessonSlug][0]-> { ${lessonFields} },
      *[_type == "course" && slug.current == $courseSlug && locale == $locale][0]
        .modules[]->lessons[@->slug.current == $lessonSlug][0]-> { ${lessonFields} }
    )`,
    { courseSlug, lessonSlug, locale }
  );
}

export async function getFeaturedCourses(locale = "pt-BR", limit = 6): Promise<SanityCourse[]> {
  return publicClient.fetch(
    `*[_type == "course" && status == "published" && locale == $locale] | order(_createdAt desc) [0...$limit] { ${courseFields} }`,
    { locale, limit }
  );
}

export interface CourseTrackInfo {
  _id: string;
  trackId: number;
  lessonCount: number;
  onChainCourseId: string;
}

/**
 * Lightweight query: fetches only _id, trackId, and lesson count for all
 * published courses. Used by SkillRadarChart to map courseId -> trackId without
 * fetching full course content.
 */
export async function getCourseTrackMap(locale = "pt-BR"): Promise<CourseTrackInfo[]> {
  return publicClient.fetch(
    `*[_type == "course" && status == "published" && locale == $locale] {
      _id,
      trackId,
      onChainCourseId,
      "lessonCount": count(lessons)
    }`,
    { locale }
  );
}
