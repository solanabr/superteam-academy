import type { NextConfig } from "next";
import path from "path";
// next-intl plugin disabled: known issue with Next 16 Turbopack (config file not found during prerender).
// import createNextIntlPlugin from "next-intl/plugin";
// const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/**
 * fill-rule / clip-rule fix: We actually REWRITE dependency source (not hide warnings).
 * - Postinstall (fix-appkit-ui-svg.js): patches node_modules on disk (fill-rule= → fillRule=, etc.).
 * - Webpack below: same replace at bundle time for production so the fix is applied regardless of resolution.
 * - Turbopack: we do NOT run this loader in dev (empty turbopack: {}) because it forced CJS on ESM and broke @privy-io/chains; dev relies on the postinstall patch only.
 */
const svgAttrReplace = {
  loader: "string-replace-loader",
  options: {
    multiple: [
      { search: "fill-rule=", replace: "fillRule=" },
      { search: "clip-rule=", replace: "clipRule=" },
    ],
  },
};

const nodeModulesPath = path.join(__dirname, "node_modules");

const nextConfig: NextConfig = {
  // Satisfy Next 16: having webpack config requires a turbopack key (empty = no custom Turbopack).
  turbopack: {},
  // SVG fix only in webpack (production build). Not in Turbopack to avoid CJS/ESM conflict on @privy-io/chains.
  // Dev relies on postinstall script (fix-appkit-ui-svg.js) for node_modules patch.
  webpack: (config) => {
    config.module ??= { rules: [] };
    const rules = config.module.rules as Array<{
      enforce?: "pre";
      test?: RegExp;
      include?: string;
      use?: unknown;
    }>;
    rules.unshift({
      enforce: "pre",
      test: /\.(m?js|cjs\.js|umd\.js)$/,
      include: nodeModulesPath,
      use: svgAttrReplace,
    });
    return config;
  },
};

export default nextConfig;
