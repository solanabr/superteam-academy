/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
	plugins: [react()],
	test: {
		environment: "jsdom",
		setupFiles: ["./src/setup.ts"],
		globals: true,
		include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
		exclude: ["node_modules", "dist", ".idea", ".git", ".cache"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html", "lcov"],
			exclude: [
				"node_modules/",
				"src/setup.ts",
				"**/*.d.ts",
				"**/*.config.{js,ts}",
				"**/*.test.{ts,tsx}",
				"**/*.spec.{ts,tsx}",
			],
			thresholds: {
				global: {
					branches: 80,
					functions: 80,
					lines: 80,
					statements: 80,
				},
			},
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@superteam-academy/ui": path.resolve(__dirname, "../ui/src"),
			"@superteam-academy/services": path.resolve(__dirname, "../services/src"),
			"@superteam-academy/config": path.resolve(__dirname, "../config/src"),
		},
	},
});
