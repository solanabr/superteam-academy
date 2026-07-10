import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemas";

export default defineConfig({
  name: "superteam-lms",
  title: "Superteam LMS",

  projectId: process.env.SANITY_STUDIO_PROJECT_ID || "placeholder",
  dataset: process.env.SANITY_STUDIO_DATASET || "production",

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },

  // Read-only Studio (spec §10.4). All writes go through the CS-9 sync. UI
  // dressing only — Viewer roles in sanity.io/manage are the real boundary (ops).
  document: {
    actions: () => [],
    newDocumentOptions: () => [],
  },
});
