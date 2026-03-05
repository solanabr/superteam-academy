import "server-only";
import { createClient } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const apiVersion = "2024-01-01";
const token = process.env.SANITY_API_TOKEN;

export const sanityWriteClient =
  projectId && token
    ? createClient({
        projectId,
        dataset,
        apiVersion,
        token,
        useCdn: false,
      })
    : null;
