import { createClient } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01";
const readToken = process.env.SANITY_API_READ_TOKEN;

export const sanityClient = projectId
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      // Private datasets require a server-side read token.
      // Keep CDN on for public read; disable CDN when token is used.
      useCdn: !readToken,
      token: readToken,
    })
  : null;
