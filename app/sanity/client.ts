/**
 * @fileoverview Sanity CMS client configuration and common GROQ queries.
 */

import { createClient } from "next-sanity";

/**
 * Global Sanity client instance for fetching content.
 * Configured with environment variables for project ID and dataset.
 */
export const client = createClient({
	projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "replace-me-123",
	dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
	apiVersion: "2024-02-20", // Use the current date for the latest API version
	useCdn: process.env.NODE_ENV === "production", // Use edge cache in production
});

/**
 * GROQ query to fetch all published courses with minimal metadata for the catalog.
 */
export const ALL_COURSES_QUERY = `
  *[_type == "course" && status == "published" && onChainStatus == "published"] {
    _id,
    title,
    "slug": slug.current,
    description,
    "imageUrl": image.asset->url,
    difficulty,
    status,
    creatorWallet,
    track_id,
    track_level,
    xp_per_lesson,
    duration,
    durationMinutes,
    tag,
    icon,
    "moduleCount": count(modules),
    "totalLessons": count(modules[].lessons[])
  }
`;

export const PENDING_REVIEW_COURSES_QUERY = `
  *[_type == "course" && status == "review_pending"] {
    _id,
    title,
    "slug": slug.current,
    description,
    "imageUrl": image.asset->url,
    difficulty,
    xp_per_lesson,
    creator_reward_xp,
    creatorWallet,
    duration,
    "moduleCount": count(modules),
    "totalLessons": count(modules[].lessons[]),
    _updatedAt
  }
`;

export const COURSE_BY_SLUG_QUERY = `
  *[_type == "course" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    description,
    "imageUrl": image.asset->url,
    difficulty,
    track_id,
    track_level,
    xp_per_lesson,
    creator_reward_xp,
    min_completions_for_reward,
    duration,
    tag,
    onChainStatus,
    icon,
    prerequisite_course-> { "slug": slug.current },
    modules[]-> {
      _id,
      title,
      order,
      lessons[]-> {
        _id,
        title,
        type,
        duration,
        content,
        hints,
        starterCode,
        solutionCode,
        testCases
      }
    }
  }
`;
