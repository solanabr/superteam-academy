import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { isOnboardingComplete } from '@/lib/services/onboarding.service';

// Protected routes that require authentication
const protectedRoutePrefixes = [
  '/dashboard',
  '/courses',
  '/leaderboard',
  '/profile',
  '/settings',
  '/certificates',
  '/achievements',
  '/challenges',
  '/analytics',
  '/community',
  '/notifications',
  '/admin',
  '/admin-premium',
];

// Routes that skip onboarding check
const skipOnboardingCheckRoutes = [
  '/onboarding',
  '/auth',
  '/api',
  '/_next',
  '/public',
  '/privacy',
  '/terms',
  '/cookies',
];

// Admin-only route prefixes
const adminRoutePrefixes = ['/admin', '/admin-premium'];

// Auth routes that should redirect to dashboard if already logged in
const authRoutes = ['/auth/signin'];

export async function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // Get session token
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  });
  const tokenUserId = typeof token?.id === 'string' ? token.id : null;
  const tokenEmail = typeof token?.email === 'string' ? token.email : null;
  const isAuthenticated = !!token && !!tokenUserId;

  const adminUserIds = (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const hasAdminAllowlist = adminUserIds.length > 0 || adminEmails.length > 0;
  const isAdmin = hasAdminAllowlist
    ? (!!tokenUserId && adminUserIds.includes(tokenUserId)) ||
      (!!tokenEmail && adminEmails.includes(tokenEmail.toLowerCase()))
    : isAuthenticated;

  // Check if current path is a protected route
  const isProtectedRoute = protectedRoutePrefixes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const isAdminRoute = adminRoutePrefixes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if current path is an auth route
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if onboarding check should be skipped
  const shouldSkipOnboardingCheck = skipOnboardingCheckRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  // Redirect unauthenticated users to sign in for protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const callbackUrl = encodeURIComponent(`${pathname}${nextUrl.search}`);
    return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${callbackUrl}`, nextUrl));
  }

  // Redirect non-admin users away from admin routes
  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  // Check onboarding status for authenticated users accessing protected routes
  if (isAuthenticated && isProtectedRoute && !shouldSkipOnboardingCheck && tokenUserId) {
    try {
      const onboardingComplete = await isOnboardingComplete(tokenUserId);

      // If onboarding is NOT complete and user is trying to access dashboard or protected routes
      if (!onboardingComplete && pathname !== '/onboarding') {
        return NextResponse.redirect(new URL('/onboarding', nextUrl));
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // If there's an error checking onboarding, let the request through
      // The client-side will handle the redirect
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
