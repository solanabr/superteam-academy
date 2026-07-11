import { defineConfig } from "vitest/config";

// Root vitest harness for standalone `scripts/` (the monorepo's workspaces each
// carry their own config; repo-root scripts had none). Run with the web
// workspace's already-installed vitest binary — no new root dependency:
//   ./apps/web/node_modules/.bin/vitest run --config vitest.config.ts
export default defineConfig({
  test: {
    include: ["scripts/**/*.test.ts"],
    environment: "node",
  },
});
