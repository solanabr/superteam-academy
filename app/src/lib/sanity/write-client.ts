import { createClient } from "next-sanity";

/**
 * Write-enabled Sanity client for server-side API routes only.
 *
 * Requires SANITY_API_TOKEN env var with write permissions.
 */
export const sanityWriteClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2026-02-19",
  token: process.env.SANITY_API_TOKEN!,
  useCdn: false,
});
