import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './i18n/config';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

const PROTECTED_ROUTES = ['/dashboard', '/profile', '/settings', '/certificates', '/admin'];
const PUBLIC_ROUTES = ['/', '/courses', '/leaderboard', '/onboarding', '/practice', '/quiz', '/community'];

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  const pathnameWithoutLocale = pathname.replace(/^\/(en|pt-BR|es)/, '') || '/';
  
  const isProtected = PROTECTED_ROUTES.some(route => pathnameWithoutLocale.startsWith(route));
  const isPublic = PUBLIC_ROUTES.some(route => pathnameWithoutLocale === route || pathnameWithoutLocale.startsWith(route + '/'));
  
  if (isProtected && !isPublic) {
    const privyToken = req.cookies.get('privy-token');
    const hasWallet = req.cookies.get('solana-wallet');
    
    if (!privyToken && !hasWallet) {
      const locale = pathname.split('/')[1] || 'en';
      const redirectUrl = new URL(`/${locale}/onboarding`, req.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }
  
  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
