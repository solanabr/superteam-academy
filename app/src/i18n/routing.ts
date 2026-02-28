import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "pt-BR", "es"],
  defaultLocale: "en",
  pathnames: {
    "/": "/",
    "/courses": "/courses",
    "/courses/[slug]": "/courses/[slug]",
    "/courses/[slug]/lessons/[id]": "/courses/[slug]/lessons/[id]",
    "/leaderboard": "/leaderboard",
    "/dashboard": "/dashboard",
    "/profile": "/profile",
    "/profile/[username]": "/profile/[username]",
    "/settings": "/settings",
    "/certificates/[id]": "/certificates/[id]",
    "/community": "/community",
    "/admin": "/admin",
    "/onboarding": "/onboarding",
  },
});

export type Locale = (typeof routing.locales)[number];
