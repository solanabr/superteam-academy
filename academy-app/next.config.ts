import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // i18n: {
  //   locales: ["pt-BR", "es", "en"],
  //   defaultLocale: "en",
    
  // }
};

const withNextInt = createNextIntlPlugin()

export default withNextInt(nextConfig);

