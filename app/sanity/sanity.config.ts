import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { codeInput } from "@sanity/code-input";
import course from "./schemas/course";
import module from "./schemas/module";
import lesson from "./schemas/lesson";
import instructor from "./schemas/instructor";

export default defineConfig({
  name: "superteam-academy",
  title: "Superteam Academy CMS",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "k9esrahg",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  plugins: [structureTool(), visionTool(), codeInput()],
  schema: {
    types: [course, module, lesson, instructor],
  },
});
