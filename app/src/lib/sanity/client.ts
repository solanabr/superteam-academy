import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';
type SanityImageSource = any;

// Sanity configuration
export const sanityConfig = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
  useCdn: process.env.NODE_ENV === 'production',
  token: process.env.SANITY_API_TOKEN, // Only used for write operations
};

// Create Sanity client
export const sanityClient = createClient(sanityConfig);

// Create authenticated client for server-side operations
export const sanityWriteClient = createClient({
  ...sanityConfig,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

// Image URL builder
const builder = createImageUrlBuilder(sanityClient);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

// Type-safe GROQ query helper
export async function sanityFetch<T>(query: string, params?: Record<string, unknown>): Promise<T> {
  if (params) {
    return sanityClient.fetch<T>(query, params);
  }
  return sanityClient.fetch<T>(query);
}

// Preview client (for draft content)
export const previewClient = createClient({
  ...sanityConfig,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
  perspective: 'previewDrafts',
});

export function getClient(preview = false) {
  return preview ? previewClient : sanityClient;
}
