import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./sanity/schemaTypes";

export default defineConfig({
	name: "default",
	title: "Superteam Academy CMS",

	// Use dummy project ID for now, you can replace these with real ones from sanity.io later
	projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "replace-me-123",
	dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",

	// This paths must match the dynamic route we create in app/[locale]/creator/studio/[[...index]]/page.tsx
	// We omit the locale from the generic configuration, next-sanity handles the routing.
	// Actually, because of Next-Intl and [locale], we should tell Sanity to relative-route,
	// or define the absolute path in the Studio component context.
	// We'll set it dynamically in the Studio page.
	basePath: "/en/creator/studio",

	plugins: [structureTool()],

	schema: {
		types: schemaTypes,
	},
});
