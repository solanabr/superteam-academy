import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { codeInput } from "@sanity/code-input";
import { course, module, lesson } from "./src/lib/sanity/schemas";

export default defineConfig({
  name: "superteam-academy",
  title: "Superteam Academy",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  basePath: "/studio",
  plugins: [structureTool(), codeInput()],
  schema: {
    types: [course, module, lesson],
  },
});
