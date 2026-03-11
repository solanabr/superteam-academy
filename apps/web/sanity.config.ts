"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "@superteam-lms/sanity/schemas";

export default defineConfig({
  name: "superteam-lms",
  title: "Superteam LMS",

  basePath: "/studio",

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
});
