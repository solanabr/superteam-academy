import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemas } from "./schemas";

export default defineConfig({
  name: "superteam-academy",
  title: "Superteam Academy CMS",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || "placeholder",
  dataset: process.env.SANITY_STUDIO_DATASET || "production",
  plugins: [structureTool()],
  schema: { types: schemas },
});
