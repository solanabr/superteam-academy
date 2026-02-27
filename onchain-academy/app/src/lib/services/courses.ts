/**
 * Barrel re-export — keeps existing imports working.
 *
 * Static data lives in ./curriculum-data.ts
 * Helper functions & async fetchers live in ./course-helpers.ts
 */
export { courses, achievements } from "./curriculum-data";
export {
  getCourseBySlug,
  getCourseById,
  fetchCourses,
  fetchCourseBySlug,
} from "./course-helpers";
