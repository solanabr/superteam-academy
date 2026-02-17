/**
 * CMS content type definitions for Sanity Studio.
 *
 * These types document the expected Sanity Studio schema structure.
 * They are not runtime Sanity Studio schema objects -- use them as a
 * reference when configuring Sanity Studio separately.
 *
 * -----------------------------------------------------------------------
 * COURSE DOCUMENT
 * -----------------------------------------------------------------------
 * name: "course"
 * type: "document"
 * title: "Course"
 *
 * Fields:
 *   title        - string, required. Display name of the course.
 *   slug         - slug, required. URL-friendly identifier (sourced from title).
 *   description  - text, required. Full course description (plain text).
 *   instructor   - string, required. Instructor display name.
 *   instructorAvatar - string, optional. Two-letter initials or image URL.
 *   difficulty   - string, required. One of: "Beginner", "Intermediate", "Advanced".
 *   duration     - string, required. Human-readable total duration (e.g. "12h 30m").
 *   xp           - number, required. Total XP awarded for completing the course.
 *   rating       - number, optional. Average rating (0-5).
 *   tags         - array of string, optional. Filterable tags (e.g. ["Solana", "Rust"]).
 *   thumbnail    - image, optional. Course thumbnail image.
 *   modules      - array of Module, required. Ordered list of course modules.
 *
 * -----------------------------------------------------------------------
 * MODULE OBJECT
 * -----------------------------------------------------------------------
 * name: "module"
 * type: "object"
 * title: "Module"
 *
 * Fields:
 *   title   - string, required. Module display name.
 *   order   - number, required. Sort order within the course (0-indexed).
 *   lessons - array of Lesson, required. Ordered list of lessons.
 *
 * -----------------------------------------------------------------------
 * LESSON OBJECT
 * -----------------------------------------------------------------------
 * name: "lesson"
 * type: "object"
 * title: "Lesson"
 *
 * Fields:
 *   id          - string, required. Unique lesson identifier within the course.
 *   title       - string, required. Lesson display name.
 *   type        - string, required. One of: "video", "reading", "challenge".
 *   duration    - string, required. Human-readable duration (e.g. "15m").
 *   content     - markdown (text), optional. Lesson body content.
 *   starterCode - text, optional. Pre-filled code for challenge lessons.
 *   testCases   - array of text, optional. Expected outputs / assertions for challenges.
 *   hints       - array of text, optional. Progressive hints for challenges.
 *   solution    - text, optional. Reference solution for challenges.
 */

export type ContentDifficulty = "Beginner" | "Intermediate" | "Advanced";

export type ContentLessonType = "video" | "reading" | "challenge";

export type ContentLesson = {
  id: string;
  title: string;
  type: ContentLessonType;
  duration: string;
  content?: string;
  starterCode?: string;
  testCases?: string[];
  hints?: string[];
  solution?: string;
};

export type ContentModule = {
  title: string;
  order: number;
  lessons: ContentLesson[];
};

export type ContentCourse = {
  title: string;
  slug: string;
  description: string;
  instructor: string;
  instructorAvatar?: string;
  difficulty: ContentDifficulty;
  duration: string;
  xp: number;
  rating?: number;
  tags: string[];
  thumbnailUrl?: string;
  modules: ContentModule[];
};
