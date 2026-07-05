import { createClient, type QueryParams } from "next-sanity";
import { env } from "@/lib/env";

export const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-01-01",
  useCdn: process.env.NODE_ENV === "production",
});

/**
 * Cached fetch wrapper — uses Next.js ISR revalidation (default 1 hour).
 * Pass revalidate=0 to bypass both Next.js cache and Sanity CDN (for admin ops).
 * Pass `tags` to associate the cache entry with cache tags so it can be purged
 * on demand via `revalidateTag(...)` (e.g. when a course is synced/approved).
 */
export async function sanityFetch<T>(
  query: string,
  params?: QueryParams,
  revalidate = 3600,
  tags?: string[]
): Promise<T> {
  const fetcher =
    revalidate === 0 ? client.withConfig({ useCdn: false }) : client;
  return fetcher.fetch<T>(query, params ?? {}, {
    next: { revalidate, tags },
  });
}
