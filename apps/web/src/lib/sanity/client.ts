import { createClient, type QueryParams } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

if (!projectId || !dataset || projectId === "your-sanity-project-id") {
  console.warn(
    "Sanity credentials missing or placeholder. Course content will not be loaded."
  );
}

export const client = createClient({
  projectId: projectId || "placeholder",
  dataset: dataset || "production",
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
  // Safe fallback if Sanity is not configured
  if (!projectId || projectId === "your-sanity-project-id") {
    return (query.trim().startsWith("*") ? [] : {}) as T;
  }

  const fetcher =
    revalidate === 0 ? client.withConfig({ useCdn: false }) : client;
  return fetcher.fetch<T>(query, params ?? {}, {
    next: { revalidate },
  });
}
