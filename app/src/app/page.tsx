import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing';

/**
 * Root path: redirect to default locale so the app always has [locale] in the path.
 * Middleware also redirects / → /en; this handles cases where the request hits the app.
 */
export default function RootPage() {
  redirect(`/${routing.defaultLocale}`);
}
