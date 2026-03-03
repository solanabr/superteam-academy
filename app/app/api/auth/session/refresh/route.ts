/**
 * Session refresh endpoint.
 *
 * Forces the JWT cookie to be re-encoded with fresh data from the database.
 * Redirects to the specified URL after refreshing.
 *
 * This solves the problem where:
 * - updateSession() uses POST → returns 405 in NextAuth v4 App Router
 * - fetch('/api/auth/session') can't set cookies (browser ignores Set-Cookie from fetch)
 * - The JWT cookie retains stale onboardingComplete/role values after profile update
 *
 * Usage: window.location.href = '/api/auth/session/refresh?redirect=/dashboard'
 */
import { NextRequest, NextResponse } from 'next/server';
import { getToken, encode } from 'next-auth/jwt';
import { prisma } from '@/backend/prisma';

const VALID_ROLES = new Set(['student']);

export async function GET(request: NextRequest) {
    const redirect = request.nextUrl.searchParams.get('redirect') || '/dashboard';

    // Validate redirect URL to prevent open redirect vulnerabilities
    if (!redirect.startsWith('/') || redirect.startsWith('//')) {
        return NextResponse.json({ error: 'Invalid redirect' }, { status: 400 });
    }

    const secret = process.env.AUTH_SECRET!;
    const token = await getToken({ req: request, secret });

    if (!token?.userId) {
        console.warn('[Session Refresh] No valid token, redirecting to login');
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Refresh token data from DB
    const profile = await prisma.profiles.findUnique({
        where: { id: token.userId as string },
        select: {
            role: true,
            onboarding_complete: true,
            session_version: true,
            email: true,
            wallet_address: true,
            deleted_at: true,
        },
    });

    if (!profile || profile.deleted_at) {
        console.warn(`[Session Refresh] User ${token.userId} deleted/not found`);
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('next-auth.session-token');
        response.cookies.delete('__Secure-next-auth.session-token');
        return response;
    }

    // Update token with fresh DB values
    token.role = VALID_ROLES.has(profile.role) ? profile.role : 'student';
    token.onboardingComplete = profile.onboarding_complete;
    token.sessionVersion = profile.session_version;
    token.lastChecked = Date.now();

    console.log(`[Session Refresh] user=${token.userId} role=${token.role} onboarded=${token.onboardingComplete} → ${redirect}`);

    // Re-encode the JWT with updated values
    const newToken = await encode({ token, secret });

    // Set the new cookie and redirect
    const response = NextResponse.redirect(new URL(redirect, request.url));

    // Determine cookie name based on protocol
    const isSecure = request.url.startsWith('https');
    const cookieName = isSecure ? '__Secure-next-auth.session-token' : 'next-auth.session-token';

    response.cookies.set(cookieName, newToken, {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days (matches auth-options.ts maxAge)
    });

    return response;
}
