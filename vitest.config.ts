import { defineConfig } from "vitest/config";

// Root vitest harness for standalone `scripts/` and the program operator scripts
// in `onchain-academy/scripts/` (the monorepo's workspaces each carry their own
// config; these scripts had none). Run with the web
// workspace's already-installed vitest binary — no new root dependency:
//   ./apps/web/node_modules/.bin/vitest run --config vitest.config.ts
export default defineConfig({
  test: {
    include: ["scripts/**/*.test.ts", "onchain-academy/scripts/**/*.test.ts"],
    environment: "node",
  },
});
