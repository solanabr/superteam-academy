import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { codeInput } from "@sanity/code-input";
import { schemaTypes } from "./sanity/schemaTypes";

export default defineConfig({
  name: "superteam-academy",
  title: "Superteam Academy",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
  dataset: process.env.SANITY_STUDIO_DATASET || "production",
  plugins: [structureTool(), codeInput()],
  schema: { types: schemaTypes },
});
