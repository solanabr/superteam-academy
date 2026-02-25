import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		index: "src/index.ts",
		queries: "src/queries.ts",
		schemas: "src/schemas.ts",
		"course-stubs": "src/course-stubs.ts",
	},
	format: ["cjs", "esm"],
	dts: true,
	splitting: false,
	sourcemap: true,
	clean: true,
	external: ["next-sanity", "@sanity/image-url"],
	target: "es2020",
});
