import { createClient, type SanityClient } from '@sanity/client';

const dataset = process.env.SANITY_DATASET ?? 'production';
const apiVersion = process.env.SANITY_API_VERSION ?? '2025-01-01';

let cachedClient: SanityClient | null | undefined;

export function isSanityConfigured(): boolean {
  const projectId = process.env.SANITY_PROJECT_ID;
  return Boolean(projectId && projectId.length > 0);
}

export function getSanityClient(): SanityClient | null {
  if (cachedClient !== undefined) {
    return cachedClient;
  }

  const projectId = process.env.SANITY_PROJECT_ID;
  if (!projectId) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: true,
    token: process.env.SANITY_READ_TOKEN,
    perspective: 'published'
  });

  return cachedClient;
}
