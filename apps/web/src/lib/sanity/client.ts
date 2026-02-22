import { createClient } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "";

export const client = projectId && dataset
  ? createClient({
      projectId,
      dataset,
      useCdn: false,
      apiVersion: "2023-05-03",
    })
  : null;
