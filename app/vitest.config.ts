import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [],
    exclude: ["e2e/**", "node_modules/**"],
    environmentMatchGlobs: [
      ["src/__tests__/pda.test.ts", "node"],
      ["src/__tests__/bitmap.test.ts", "node"],
      ["src/__tests__/xp.test.ts", "node"],
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
