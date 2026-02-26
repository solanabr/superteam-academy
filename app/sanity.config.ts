"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schema } from "./sanity/schema";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "your-project-id";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

export default defineConfig({
  basePath: "/studio",
  projectId,
  dataset,
  plugins: [structureTool()],
  schema: { types: schema.types },
});
