import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import {
  courseSchema,
  lessonSchema,
  moduleSchema,
  challengeSchema,
  instructorSchema,
  codeBlockSchema,
  calloutSchema,
} from "./src/lib/sanity/schemas";

export default defineConfig({
  name: "superteam-academy",
  title: "Superteam Academy",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "placeholder",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  basePath: "/studio",
  plugins: [
    structureTool(),
    visionTool(),
  ],
  schema: {
    types: [
      courseSchema,
      moduleSchema,
      lessonSchema,
      challengeSchema,
      instructorSchema,
      codeBlockSchema,
      calloutSchema,
    ],
  },
});
