import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		index: "src/index.ts",
		"level-system": "src/level-system-integration.ts",
		"xp-engine": "src/xp-engine.ts",
		"streak-system": "src/streak-system.ts",
		"achievement-system": "src/achievement-system.ts",
	},
	format: ["cjs", "esm"],
	dts: true,
	splitting: false,
	sourcemap: true,
	clean: true,
	external: ["zod"],
	target: "es2020",
	minify: false,
	keepNames: true,
});
