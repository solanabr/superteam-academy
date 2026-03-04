import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Vercel needs this to find the middleware.js.nft.json file when the
  // Next.js app lives inside a subdirectory of the repository.
  outputFileTracingRoot: path.join(__dirname, "../"),
};

const withNextInt = createNextIntlPlugin()

export default withNextInt(nextConfig);


