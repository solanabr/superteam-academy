/**
 * GROQ queries for fetching course content from Sanity CMS.
 * These queries match the Sanity schema definitions in `./schemas/`.
 */

import { groq } from "next-sanity";

/** Fetch all active courses, ordered by track and level. Used by the course catalog page. */
export const allCoursesQuery = groq`*[_type == "course" && isActive == true] | order(trackId asc, trackLevel asc) {
  _id,
  title,
  "slug": slug.current,
  description,
  "thumbnail": thumbnail.asset->url,
  difficulty,
  duration,
  trackId,
  trackLevel,
  trackName,
  creator,
  isActive,
  xpTotal,
  tags,
  "lessonCount": count(modules[]->lessons[]),
  "challengeCount": count(modules[]->lessons[_type == "lesson" && type == "challenge"]),
  "totalEnrollments": 0,
  "totalCompletions": 0,
}`;

/** Fetch a single course with full module/lesson/challenge content. Used by course detail and lesson views. */
export const courseBySlugQuery = groq`*[_type == "course" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  description,
  "thumbnail": thumbnail.asset->url,
  difficulty,
  duration,
  trackId,
  trackLevel,
  trackName,
  creator,
  isActive,
  xpTotal,
  tags,
  prerequisites,
  modules[]-> {
    _id,
    title,
    description,
    order,
    lessons[]-> {
      _id,
      title,
      description,
      type,
      order,
      xpReward,
      duration,
      challenge-> {
        _id,
        prompt,
        starterCode,
        language,
        hints,
        solution,
        testCases
      }
    }
  }
}`;

/** Fetch all curated learning paths with their linked course slugs. */
export const allLearningPathsQuery = groq`*[_type == "learningPath"] | order(_createdAt asc) {
  _id,
  name,
  description,
  icon,
  courses[]->{ "slug": slug.current },
  color
}`;
