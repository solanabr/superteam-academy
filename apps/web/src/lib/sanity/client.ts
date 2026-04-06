import { createClient, type QueryParams } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "dummy00000";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  useCdn: process.env.NODE_ENV === "production",
});

/**
 * Cached fetch wrapper — uses Next.js ISR revalidation (default 1 hour).
 * Pass revalidate=0 to bypass both Next.js cache and Sanity CDN (for admin ops).
 */
export async function sanityFetch<T>(
  query: string,
  params?: QueryParams,
  revalidate = 3600
): Promise<T> {
  const fetcher =
    revalidate === 0 ? client.withConfig({ useCdn: false }) : client;
  return fetcher.fetch<T>(query, params ?? {}, {
    next: { revalidate },
  });
}
