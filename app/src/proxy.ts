import createMiddleware from "next-intl/middleware";
import { routing } from "../i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Define protected routes (platform area)
    const isProtectedRoute =
        pathname.includes("/dashboard") ||
        pathname.includes("/settings") ||
        pathname.includes("/courses") ||
        pathname.includes("/profile") ||
        pathname.includes("/leaderboard") ||
        pathname.includes("/ide") ||
        pathname.includes("/admin");

    // Don't protect the login page itself or public assets
    const isAuthPage = pathname.includes("/login");

    if (isProtectedRoute && !isAuthPage) {
        const token = request.cookies.get("privy-token");

        if (!token) {
            // Determine current locale (defaults to en)
            const locale = pathname.split('/')[1] || 'en';
            const validLocales = ['en', 'es', 'pt-BR'];
            const currentLocale = validLocales.includes(locale) ? locale : 'en';

            // Redirect to the localized login page
            const loginUrl = new URL(`/${currentLocale}/login`, request.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    return intlMiddleware(request);
}

export const config = {
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next`, `/_vercel`, or `/studio`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    matcher: ['/((?!api|_next|_vercel|studio|.*\\..*).*)'],
};
