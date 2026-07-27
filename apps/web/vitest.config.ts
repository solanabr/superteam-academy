import path from "path";
import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
  // tsconfig.json sets "jsx": "preserve" (Next.js compiles JSX at build
  // time), so esbuild's default classic transform for .tsx test files would
  // otherwise emit `React.createElement(...)` and expect an in-scope `React`
  // that no file imports. Force the automatic runtime so component tests can
  // render JSX directly without a `React` import.
  esbuild: {
    jsx: "automatic",
  },
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    // The Playwright E2E specs share the `*.spec.ts` glob but must NOT be
    // collected by vitest (they import `@playwright/test`, not the vitest
    // runner). They run via `pnpm --filter web e2e`. Keep vitest's own defaults.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
