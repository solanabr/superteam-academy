import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
    matcher: [
        // Match all pathnames except for
        // - /api (API routes)
        // - /_next (Next.js internals)
        // - /superteam-academy-studio (Sanity Studio)
        // - /.*\\..* (files with extensions, e.g. favicon.ico)
        "/((?!api|_next|superteam-academy-studio|.*\\..*).*)",
    ],
};
