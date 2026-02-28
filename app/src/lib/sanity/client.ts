/**
 * Sanity CMS client configuration.
 * Returns null when `NEXT_PUBLIC_SANITY_PROJECT_ID` is not set, enabling
 * graceful fallback to mock data in {@link ../data-service.ts}.
 */

import { createClient, type SanityClient } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

/**
 * Sanity client instance, or null when not configured.
 * Uses CDN in production for faster reads and API v2024-01-01.
 */
export const client: SanityClient | null = projectId
  ? createClient({
      projectId,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
      apiVersion: "2024-01-01",
      useCdn: process.env.NODE_ENV === "production",
    })
  : null;
