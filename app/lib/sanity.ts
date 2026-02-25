/**
 * Sanity CMS Client
 *
 * This module configures the Sanity client for content fetching.
 * Set NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET in your
 * environment to enable live CMS content. Without these vars, the app falls
 * back to static mock data (see lib/content.ts).
 *
 * Sanity project setup: https://sanity.io/manage
 * Schema definitions: /studio/schemas/ (when CMS is provisioned)
 */

export const SANITY_CONFIG = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2025-02-01',
  useCdn: process.env.NODE_ENV === 'production',
} as const;

export const isSanityConfigured =
  Boolean(SANITY_CONFIG.projectId) && Boolean(SANITY_CONFIG.dataset);

/**
 * Fetch content from Sanity using the GROQ query language.
 *
 * Falls back gracefully to null when Sanity is not configured, allowing
 * the content layer (lib/content.ts) to return mock data instead.
 */
export async function sanityFetch<T = unknown>(
  query: string,
  params: Record<string, unknown> = {},
): Promise<T | null> {
  if (!isSanityConfigured) return null;

  const encodedQuery = encodeURIComponent(query);
  const encodedParams = encodeURIComponent(JSON.stringify(params));
  const url = `https://${SANITY_CONFIG.projectId}.api.sanity.io/v${SANITY_CONFIG.apiVersion}/data/query/${SANITY_CONFIG.dataset}?query=${encodedQuery}&$params=${encodedParams}`;

  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 60 }, // ISR: revalidate every 60 seconds
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.result ?? null) as T;
  } catch {
    return null;
  }
}

// GROQ queries for each content type
export const QUERIES = {
  courses: /* groq */ `
    *[_type == "course"] | order(order asc) {
      _id,
      "id": slug.current,
      "slug": slug.current,
      title,
      description,
      level,
      track,
      xp_reward,
      lesson_count,
      duration,
      thumbnail_color,
      thumbnail_icon,
      enrollments,
      tags
    }
  `,

  courseBySlug: /* groq */ `
    *[_type == "course" && slug.current == $slug][0] {
      _id,
      "id": slug.current,
      "slug": slug.current,
      title,
      description,
      level,
      track,
      xp_reward,
      lesson_count,
      duration,
      thumbnail_color,
      thumbnail_icon,
      enrollments,
      tags,
      objectives,
      prerequisites,
      curriculum[] {
        title,
        duration,
        xp,
        free,
        "lessonId": lesson->slug.current
      }
    }
  `,

  leaderboard: /* groq */ `
    *[_type == "userProfile"] | order(xp desc) [0...50] {
      "address": walletAddress,
      username,
      avatar,
      xp,
      streak,
      badges,
      rank
    }
  `,
};
