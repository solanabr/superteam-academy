import createMiddleware from 'next-intl/middleware';
import {NextRequest, NextResponse} from 'next/server';
import {routing} from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

const PROTECTED_ROOT_SEGMENTS = new Set(["dashboard", "settings"]);
const NEXT_AUTH_SESSION_COOKIE_NAMES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

function stripLocale(pathname: string): { locale: string; rest: string[] } {
  const parts = pathname.split('/').filter(Boolean);
  const maybeLocale = parts[0];
  if (maybeLocale && routing.locales.includes(maybeLocale as (typeof routing.locales)[number])) {
    return { locale: maybeLocale, rest: parts.slice(1) };
  }
  return { locale: routing.defaultLocale, rest: parts };
}

function isProtectedPath(pathname: string): boolean {
  const { rest } = stripLocale(pathname);
  if (rest.length === 0) return false;

  if (PROTECTED_ROOT_SEGMENTS.has(rest[0])) return true;
  // Private profile route only. Public profile pages are /profile/[username].
  if (rest[0] === "profile" && rest.length === 1) return true;

  return false;
}

function hasSocialSession(request: NextRequest): boolean {
  return NEXT_AUTH_SESSION_COOKIE_NAMES.some((name) =>
    Boolean(request.cookies.get(name)?.value),
  );
}

function hasWalletHint(request: NextRequest): boolean {
  return Boolean(request.cookies.get("academy_wallet_hint")?.value);
}

function buildAuthRedirect(request: NextRequest): NextResponse {
  const { locale } = stripLocale(request.nextUrl.pathname);
  const url = request.nextUrl.clone();
  const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  url.pathname = `/${locale}/auth`;
  url.search = "";
  url.searchParams.set("returnTo", returnTo);
  return NextResponse.redirect(url);
}

export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const locales = routing.locales;
  const parts = pathname.split('/').filter(Boolean);

  // Defensive fix: normalize accidental double-locale paths like /en/en/courses/...
  if (
    parts.length >= 2 &&
    locales.includes(parts[0] as (typeof locales)[number]) &&
    locales.includes(parts[1] as (typeof locales)[number])
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/${parts.slice(1).join('/')}`;
    return NextResponse.redirect(url);
  }

  if (isProtectedPath(pathname)) {
    const allow = hasSocialSession(request) || hasWalletHint(request);
    if (!allow) {
      return buildAuthRedirect(request);
    }
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
