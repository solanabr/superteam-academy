import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for:
  // - /api routes
  // - /_next (Next.js internals)
  // - /_vercel (Vercel internals)
  // - /.*\\..*  (files with extensions, e.g. favicon.ico)
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)",
    // Also match the root for locale redirect
    "/",
  ],
};
