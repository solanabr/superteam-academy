import { createClient } from 'next-sanity';
import { mockClient } from './mock-client';

const isSanityConfigured =
  typeof process !== 'undefined' &&
  !!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID &&
  !!process.env.NEXT_PUBLIC_SANITY_DATASET;

const sanityClient = isSanityConfigured
  ? createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
      apiVersion: '2026-02-24',
      useCdn: true,
    })
  : null;

export const client = {
  fetch: <T>(query: string, params?: Record<string, unknown>): Promise<T> => {
    if (sanityClient) {
      // Cast params to satisfy next-sanity's strict overload signatures
      return params
        ? sanityClient.fetch<T>(query, params as Record<string, string>)
        : sanityClient.fetch<T>(query);
    }
    return mockClient.fetch<T>(query, params);
  },
};
