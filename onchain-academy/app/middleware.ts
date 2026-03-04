/**
 * middleware.ts — project root
 *
 * FIX: Implicit 'any' on cookiesToSet destructure — same root cause as
 * lib/supabase/server.ts. Added `import type { CookieOptionsWithName }` and
 * annotated the setAll parameter.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptionsWithName } from '@supabase/ssr';

const LOCALES       = ['en', 'pt-br', 'es'] as const;
type Locale         = typeof LOCALES[number];
const DEFAULT_LOCALE: Locale = 'en';

const PROTECTED_PATTERNS = [
  /^\/dashboard(\/.*)?$/,
  /^\/courses\/[^/]+\/lessons(\/.*)?$/,
];

function isValidLocale(s: string): s is Locale {
  return (LOCALES as readonly string[]).includes(s);
}
function getLocaleFromPath(pathname: string): Locale | null {
  const segment = pathname.split('/')[1] ?? '';
  return isValidLocale(segment) ? segment : null;
}
export function stripLocale(pathname: string): string {
  const pattern = new RegExp(`^\\/(${LOCALES.join('|')})(\/.*)?$`);
  const match   = pathname.match(pattern);
  return match ? (match[2] || '/') : pathname;
}
export function isProtectedPath(barePath: string): boolean {
  return PROTECTED_PATTERNS.some((p) => p.test(barePath));
}
function setCookieLocale(response: NextResponse, locale: Locale): void {
  response.cookies.set('NEXT_LOCALE', locale, {
    path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax', httpOnly: false,
  });
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const localeInUrl  = getLocaleFromPath(pathname);
  const cookieRaw    = request.cookies.get('NEXT_LOCALE')?.value ?? '';
  const cookieLocale = isValidLocale(cookieRaw) ? cookieRaw : null;
  const resolved: Locale = localeInUrl ?? cookieLocale ?? DEFAULT_LOCALE;

  if (!localeInUrl) {
    const redirectUrl = new URL(
      `/${resolved}${pathname === '/' ? '' : pathname}`, request.url,
    );
    request.nextUrl.searchParams.forEach((v, k) => redirectUrl.searchParams.set(k, v));
    const res = NextResponse.redirect(redirectUrl, { status: 307 });
    setCookieLocale(res, resolved);
    return res;
  }

  const cookieNeedsUpdate = request.cookies.get('NEXT_LOCALE')?.value !== localeInUrl;
  const barePath = stripLocale(pathname);

  if (!isProtectedPath(barePath)) {
    const res = NextResponse.next();
    if (cookieNeedsUpdate) setCookieLocale(res, localeInUrl);
    return res;
  }

  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        // FIX: explicit CookieOptionsWithName[] removes implicit-any on destructure
        setAll: (cookiesToSet: CookieOptionsWithName[]) => {
          cookiesToSet.forEach(({ name, value, options }: any) =>
            res.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = new URL(`/${localeInUrl}`, request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (cookieNeedsUpdate) setCookieLocale(res, localeInUrl);
  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|auth/callback|.*\\..*).*)',
  ],
};
