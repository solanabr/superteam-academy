/**
 * Sanity CMS client.
 *
 * Uses dynamic import so the app builds even when @sanity/client
 * is not installed. Install it with: pnpm add @sanity/client
 */

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiToken = process.env.SANITY_API_TOKEN;

export function isCmsConfigured(): boolean {
  return Boolean(projectId && dataset);
}

export type SanityClientLike = {
  fetch<T>(query: string, params?: Record<string, unknown>): Promise<T>;
};

let clientInstance: SanityClientLike | null | undefined;

export async function getSanityClient(): Promise<SanityClientLike | null> {
  if (clientInstance !== undefined) return clientInstance;

  if (!isCmsConfigured()) {
    clientInstance = null;
    return null;
  }

  try {
    const { createClient } = await import("@sanity/client");
    clientInstance = createClient({
      projectId: projectId!,
      dataset: dataset!,
      token: apiToken || undefined,
      apiVersion: "2024-01-01",
      useCdn: !apiToken,
    });
    return clientInstance;
  } catch {
    clientInstance = null;
    return null;
  }
}
