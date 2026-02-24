import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // These rules flag standard React patterns (setMounted in useEffect,
      // async data fetching, document.cookie writes). Disable until codebase
      // is migrated to React Compiler-friendly patterns.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      // Allow _-prefixed variables to be unused (standard convention for
      // intentionally unused params in interface implementations).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
