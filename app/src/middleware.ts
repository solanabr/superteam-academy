import { clerkMiddleware } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import type { NextRequest } from "next/server";

const intlMiddleware = createIntlMiddleware(routing);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  // Skip intl routing for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return;
  }
  return intlMiddleware(request);
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
};
