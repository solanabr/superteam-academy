import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './context/i18n/routing';
import { canAccessRoute } from './backend/admin/route-guard';
import { encryptCallbackUrl } from './backend/auth/callback';

const PROTECTED_ROUTES = ['/dashboard', '/settings', '/courses', '/onboarding'];

/**
 * Routes that need auth only for the exact path (not sub-paths).
 * /profile (own profile) is protected, but /profile/username (public) is not.
 */
const EXACT_PROTECTED_ROUTES = ['/profile'];

/** Maximum request body size in bytes (1 MB) */
const MAX_BODY_SIZE = 1 * 1024 * 1024;

// ── Onboarding Bypass List ───────────────────────────────────────────
// /api/ covers /api/auth/* (NextAuth sign-in/sign-out routes).
// If custom auth pages exist outside /api/ (e.g., /en/auth/signin),
// add them here explicitly.
const ONBOARDING_BYPASS = [
    '/onboarding', '/api/', '/logout', '/login', '/_next/',
    '/favicon.ico', '/static/', '/images/', '/webhooks/', '/profile/',
];

const intlMiddleware = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ── Admin routes — skip i18n but enforce auth + admin whitelist ─────
    // Must come BEFORE the i18n skip block so /admin is handled here.
    // The JWT token's `isAdmin` flag is refreshed every session from:
    //   1. DB admin_whitelist table (email or wallet)
    //   2. ADMIN_WALLETS env variable (fallback)
    if (pathname.startsWith('/admin')) {
        const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
        const isValidToken = token && token.userId && !token.sessionInvalid;

        // Unauthenticated → redirect to login
        if (!isValidToken) {
            const loginUrl = new URL('/en/login', request.url);
            loginUrl.searchParams.set('token', encryptCallbackUrl(pathname));
            const response = NextResponse.redirect(loginUrl);
            if (token && !isValidToken) {
                response.cookies.delete('next-auth.session-token');
                response.cookies.delete('__Secure-next-auth.session-token');
            }
            return response;
        }

        // Authenticated but not admin (wallet/email not whitelisted) → redirect to dashboard
        if (!canAccessRoute(token, pathname)) {
            return NextResponse.redirect(new URL('/en/dashboard', request.url));
        }

        // Admin verified — allow through (no i18n rewrite needed)
        const response = NextResponse.next();
        addSecurityHeaders(response);
        return response;
    }

    // Skip i18n for API routes and static assets
    if (
        pathname.startsWith('/api/') ||
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/_vercel/') ||
        pathname.includes('.')
    ) {
        // Body size limit for API mutation routes (prevents JSON bombing)
        if (
            pathname.startsWith('/api/') &&
            (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')
        ) {
            const contentLength = request.headers.get('content-length');
            if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
                return NextResponse.json(
                    { error: 'Request body too large. Maximum size is 1MB.' },
                    { status: 413 }
                );
            }
        }

        const response = NextResponse.next();
        addSecurityHeaders(response);
        return response;
    }

    // Run next-intl middleware (handles locale detection, redirect, rewrite)
    const intlResponse = intlMiddleware(request);

    // Extract the locale from the resolved URL to check routes with locale prefix stripped
    const localeRegex = /^\/(en|pt-BR|es)(\/|$)/;
    const localeMatch = pathname.match(localeRegex);
    const pathnameWithoutLocale = localeMatch
        ? pathname.replace(localeRegex, '/')
        : pathname;

    const token = await getToken({
        req: request,
        secret: process.env.AUTH_SECRET,
    });

    // Check prefix-based protected routes + exact-match protected routes
    const isProtectedRoute = PROTECTED_ROUTES.some((r) =>
        pathnameWithoutLocale.startsWith(r)
    ) || EXACT_PROTECTED_ROUTES.some((r) =>
        pathnameWithoutLocale === r || pathnameWithoutLocale === `${r}/`
    );

    const locale = localeMatch?.[1] || routing.defaultLocale;

    // Unauthenticated or invalidated session → redirect to login with encrypted callback token
    const isValidToken = token && token.userId && !token.sessionInvalid;

    if (isProtectedRoute && !isValidToken) {
        // Clear stale JWT cookie for deleted/invalid users
        const loginUrl = new URL(`/${locale}/login`, request.url);
        if (pathname !== `/${locale}/login`) {
            loginUrl.searchParams.set('token', encryptCallbackUrl(pathname));
        }
        const response = NextResponse.redirect(loginUrl);
        if (token && !isValidToken) {
            // Delete the stale session cookie so the user isn't stuck in a loop
            response.cookies.delete('next-auth.session-token');
            response.cookies.delete('__Secure-next-auth.session-token');
            console.log(`[Proxy] Cleared stale session for deleted user, redirecting to login`);
        }
        return response;
    }

    // Authenticated but wrong role → 403 (not redirect)
    if (isValidToken && !canAccessRoute(token, pathnameWithoutLocale)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Redirect authenticated users away from login
    if (pathnameWithoutLocale === '/login' && isValidToken) {
        // Route new users to onboarding, returning users to dashboard
        const target = token.onboardingComplete ? '/dashboard' : '/onboarding';
        return NextResponse.redirect(new URL(`/${locale}${target}`, request.url));
    }

    // If on login with an invalid/deleted token, clear the cookie so they get a fresh start
    if (pathnameWithoutLocale === '/login' && token && !isValidToken) {
        const response = intlMiddleware(request);
        response.cookies.delete('next-auth.session-token');
        response.cookies.delete('__Secure-next-auth.session-token');
        addSecurityHeaders(response);
        return response;
    }

    // Onboarding redirect for users who haven't completed it
    if (isValidToken && !token.onboardingComplete) {
        const needsOnboarding = !ONBOARDING_BYPASS.some((p) =>
            pathnameWithoutLocale.startsWith(p)
        );
        if (needsOnboarding) {
            return NextResponse.redirect(new URL(`/${locale}/onboarding`, request.url));
        }
    }

    // Redirect completed users AWAY from /onboarding
    if (isValidToken && token.onboardingComplete && pathnameWithoutLocale === '/onboarding') {
        return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
    }

    addSecurityHeaders(intlResponse);
    return intlResponse;
}

function addSecurityHeaders(response: NextResponse): void {
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
