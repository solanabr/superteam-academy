import { clerkMiddleware } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import type { NextRequest } from "next/server";

const handleI18nRouting = createIntlMiddleware(routing);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  return handleI18nRouting(request);
});

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
