import { defineConfig } from "sanity";
import { courseSchema } from "@/sanity/schemas/course";
import { moduleSchema } from "@/sanity/schemas/module";
import { lessonSchema } from "@/sanity/schemas/lesson";

export default defineConfig({
  name: "superteam-academy",
  title: "Superteam Academy",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "local",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  schema: {
    types: [courseSchema, moduleSchema, lessonSchema]
  }
});
