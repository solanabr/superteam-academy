import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["pt", "es", "en"],
  defaultLocale: "pt",
  localePrefix: "always", // / → /pt para evitar 404
});
