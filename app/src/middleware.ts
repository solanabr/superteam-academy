import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed'
});

export const config = {
  // Match all pathnames except for
  // - api routes
  // - static files (images, etc)
  // - Next.js internals
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
