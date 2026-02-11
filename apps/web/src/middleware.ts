import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes — always accessible
  if (
    pathname === '/' ||
    pathname.startsWith('/courses') ||
    pathname.startsWith('/certificates') ||
    pathname.startsWith('/leaderboard') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots') ||
    pathname.startsWith('/sitemap')
  ) {
    return NextResponse.next();
  }

  // For protected routes, check if session token exists
  const token = req.cookies.get('next-auth.session-token')?.value
    ?? req.cookies.get('__Secure-next-auth.session-token')?.value;

  if (!token) {
    // For demo purposes, allow access to all pages without auth
    // In production, uncomment the redirect below:
    // const signInUrl = new URL('/auth/signin', req.url);
    // signInUrl.searchParams.set('callbackUrl', pathname);
    // return NextResponse.redirect(signInUrl);
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
