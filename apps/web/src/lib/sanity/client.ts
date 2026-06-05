import { createClient, type QueryParams } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const sanityConfigured = Boolean(projectId && dataset);

const fallbackClient = {
  withConfig() {
    return this;
  },
  async fetch<T>(query: string): Promise<T> {
    return fallbackSanityResult<T>(query);
  },
};

export const client = sanityConfigured
  ? createClient({
      projectId: projectId!,
      dataset: dataset!,
      apiVersion: "2024-01-01",
      useCdn: process.env.NODE_ENV === "production",
    })
  : (fallbackClient as ReturnType<typeof createClient>);

/**
 * Cached fetch wrapper — uses Next.js ISR revalidation (default 1 hour).
 * Pass revalidate=0 to bypass both Next.js cache and Sanity CDN (for admin ops).
 */
export async function sanityFetch<T>(
  query: string,
  params?: QueryParams,
  revalidate = 3600
): Promise<T> {
  if (!sanityConfigured) {
    return fallbackSanityResult<T>(query);
  }

  const fetcher =
    revalidate === 0 ? client.withConfig({ useCdn: false }) : client;
  return fetcher.fetch<T>(query, params ?? {}, {
    next: { revalidate },
  });
}

function fallbackSanityResult<T>(query: string): T {
  const normalizedQuery = query.replace(/\s+/g, " ");
  if (normalizedQuery.includes("[0]")) {
    return null as T;
  }

  return [] as T;
}
