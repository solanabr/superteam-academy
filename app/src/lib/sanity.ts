import { createClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

export const sanityEnabled = Boolean(projectId && dataset);

export const sanityClient = sanityEnabled
  ? createClient({
      projectId,
      dataset,
      apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2026-01-01",
      useCdn: true,
      token: process.env.SANITY_API_TOKEN,
    })
  : null;
