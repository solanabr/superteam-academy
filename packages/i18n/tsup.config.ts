import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		index: "src/index.ts",
		config: "src/config.ts",
		routing: "src/routing.ts",
		navigation: "src/navigation.ts",
		proxy: "src/proxy.ts",
	},
	format: ["cjs", "esm"],
	dts: true,
	splitting: false,
	sourcemap: true,
	clean: true,
	external: ["next", "react", "next-intl"],
	target: "es2020",
	minify: false,
	keepNames: true,
});
