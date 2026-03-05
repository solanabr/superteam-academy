import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { markdownSchema } from "sanity-plugin-markdown";
import { schemaTypes } from "./src/sanity/schemas";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "placeholder";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export default defineConfig({
  name: "superteam-academy",
  title: "Superteam Academy CMS",
  basePath: "/studio",
  projectId,
  dataset,
  plugins: [structureTool(), markdownSchema()],
  schema: { types: schemaTypes },
});
