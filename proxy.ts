import createMiddleware from 'next-intl/middleware';
import { updateSession } from '@/lib/supabase/proxy'
import { type NextRequest } from 'next/server'

const i18nMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'pt', 'es'],

  // Used when no locale matches
  defaultLocale: 'en',
  
  // Always use a prefix for the locale (e.g. /en/about)
  localePrefix: 'always'
});

export default async function proxy(request: NextRequest) {
  // First update the supabase session
  await updateSession(request);
  
  // Then run the i18n middleware
  return i18nMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(pt|es|en)/:path*', '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
};
