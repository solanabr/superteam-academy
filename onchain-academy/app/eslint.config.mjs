import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Data-fetching in useEffect that calls setState is a legitimate pattern.
      // This will be replaced by React's `use()` hook when stable.
      "react-hooks/set-state-in-effect": "warn",
      // Allow unused vars/args prefixed with underscore
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Playwright E2E tests (separate tsconfig)
    "e2e/**",
    "playwright.config.ts",
  ]),
]);

export default eslintConfig;
