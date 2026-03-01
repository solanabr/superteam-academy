import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		index: "src/index.ts",
		"streak-system": "src/streak-system.ts",
	},
	format: ["cjs", "esm"],
	dts: true,
	splitting: false,
	sourcemap: true,
	clean: true,
	target: "es2020",
	minify: false,
	keepNames: true,
});
