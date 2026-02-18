import { createClient } from '@sanity/client';

// Sanity client configuration
// For production, set these environment variables:
// NEXT_PUBLIC_SANITY_PROJECT_ID - Your Sanity project ID
// NEXT_PUBLIC_SANITY_DATASET - Dataset name (usually 'production')

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'demo',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: process.env.NODE_ENV === 'production',
});

// Preview client without CDN caching
export const previewClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'demo',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

export const getClient = (preview = false) => (preview ? previewClient : client);
