import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		index: "src/index.ts",
		config: "src/config.ts",
		routing: "src/routing.ts",
		utils: "src/utils.ts",
		validation: "src/validation.ts",
		extraction: "src/extraction.ts",
		middleware: "src/middleware.ts",
		ssr: "src/ssr.ts",
	},
	format: ["cjs", "esm"],
	dts: true,
	splitting: false,
	sourcemap: true,
	clean: true,
	external: ["next", "react", "next-intl", "zod", "glob"],
	target: "es2020",
	minify: false,
	keepNames: true,
});
