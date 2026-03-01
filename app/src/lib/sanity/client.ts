/**
 * Sanity CMS client
 *
 * To enable Sanity CMS integration:
 * 1. npm install next-sanity
 * 2. Set NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET in .env.local
 * 3. Uncomment the client below
 */

import type { SanityCourse } from '@/types';

// import { createClient } from 'next-sanity';
// export const sanityClient = createClient({
//   projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
//   dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
//   apiVersion: '2024-01-01',
//   useCdn: true,
// });

/** Fetch course content from Sanity (stub - returns null until Sanity is configured) */
export async function fetchSanityCourse(_courseId: string): Promise<SanityCourse | null> {
  // TODO: Implement with sanityClient.fetch() when Sanity is configured
  return null;
}

/** Fetch all courses from Sanity (stub) */
export async function fetchAllSanityCourses(): Promise<SanityCourse[]> {
  return [];
}
