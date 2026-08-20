import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { env } from "@/lib/env";
import { locales, defaultLocale } from "@/lib/i18n/config";
import { isAdminRoute } from "@/lib/admin/routes";
import { buildCsp, generateNonce } from "@/lib/csp";

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

function isProtectedRoute(pathname: string): boolean {
  // Only routes that require authentication (personal data)
  // Public routes (/courses, /leaderboard, /certificates/[id]) are NOT listed here
  const protectedPaths = ["/dashboard", "/settings", "/teach", "/review"];

  // Strip locale prefix to check the remaining path
  for (const locale of locales) {
    const prefix = `/${locale}`;
    if (pathname.startsWith(prefix)) {
      const rest = pathname.slice(prefix.length);

      // /profile (exact) is protected (own profile),
      // but /profile/[userId] is public (viewing others)
      if (rest === "/profile" || rest === "/profile/") return true;

      return protectedPaths.some((p) => rest.startsWith(p));
    }
  }

  return false;
}

export async function middleware(request: NextRequest) {
  // Per-request CSP nonce. Set on the REQUEST headers so (a) Next.js extracts
  // the nonce from the Content-Security-Policy request header and stamps it onto
  // its inline bootstrap scripts, and (b) server components can read x-nonce.
  // next-intl copies request.headers when forwarding, and the Supabase
  // NextResponse.next({ request }) calls below pick up the same mutated headers,
  // so setting them here is enough to propagate the nonce to the renderer.
  const nonce = generateNonce();
  const csp = buildCsp(nonce);
  request.headers.set("x-nonce", nonce);
  request.headers.set("Content-Security-Policy", csp);

  // Create a response that we'll modify
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Set cookies on the REQUEST so downstream middleware/server components see them
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          // Recreate the response to forward modified request cookies
          supabaseResponse = NextResponse.next({ request });
          // Set cookies on the RESPONSE so they're sent back to the browser
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // IMPORTANT: getClaims() verifies the JWT locally (WebCrypto against cached
  // JWKS) for asymmetric signing keys — zero network calls on the hot path —
  // and falls back to getUser() for HS256. Either way it refreshes an expired
  // session first, which calls setAll above. If Supabase env vars are missing
  // this fails and userId stays null, so platform routes redirect (fail-closed).
  //
  // The #461 per-request tombstone query used to live here. It's gone: every
  // writer of profiles.deleted_at now pairs with session revocation (global
  // signOut in /api/account/delete, admin ban in the shell merge), and the
  // login chokepoints (/api/auth/callback, /api/auth/wallet, /api/auth/dynamic)
  // still call isAccountDeleted. A revoked session dies at its next token
  // refresh, so the residual window is bounded by the access-token expiry.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub ?? null;

  // Now run intl middleware (after Supabase may have modified request cookies).
  // next-intl forwards request.headers (incl. the nonce + CSP set above) to the
  // renderer, so Next.js can apply the nonce to its inline bootstrap scripts.
  const intlResponse = intlMiddleware(request);

  // Enforce the CSP in the browser by also setting it on the response.
  intlResponse.headers.set("Content-Security-Policy", csp);

  // Copy Supabase cookies from supabaseResponse to intlResponse,
  // preserving all options (httpOnly, maxAge, sameSite, secure, path, etc.)
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie);
  });

  // Admin routes: gated on the SUPABASE session here, exactly like the other
  // auth-gated routes — no session means a redirect to the localized landing.
  // Whether the session's user is actually an admin (an `admin_users` row) is
  // decided server-side by `requireAdmin()` in the /admin layout/page, which
  // 404s non-admins so the panel's existence is not revealed. The middleware
  // cannot make that call itself: the allowlist is service-role-only and the
  // Edge runtime must not hold the service key.
  if (isAdminRoute(request.nextUrl.pathname)) {
    if (!userId) {
      const locale =
        locales.find((l) => request.nextUrl.pathname.startsWith(`/${l}`)) ??
        defaultLocale;
      const adminRedirect = NextResponse.redirect(
        new URL(`/${locale}`, request.url)
      );
      adminRedirect.headers.set("Content-Security-Policy", csp);
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        adminRedirect.cookies.set(cookie);
      });
      return adminRedirect;
    }
    return intlResponse;
  }

  // For platform routes, check auth (fail-closed: no user = redirect)
  if (isProtectedRoute(request.nextUrl.pathname)) {
    if (!userId) {
      const locale =
        locales.find((l) => request.nextUrl.pathname.startsWith(`/${l}`)) ??
        defaultLocale;
      const redirectUrl = new URL(`/${locale}`, request.url);
      const redirectResponse = NextResponse.redirect(redirectUrl);
      redirectResponse.headers.set("Content-Security-Policy", csp);
      // Copy Supabase cookies even to redirect responses (preserve all options)
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie);
      });
      return redirectResponse;
    }
  }

  return intlResponse;
}

export const config = {
  // Extension-anchored exclusion (not `.*\..*`): a dot anywhere in a page slug
  // (e.g. /en/courses/node.js-basics) must still hit middleware — only real
  // static-asset extensions are skipped.
  matcher: [
    "/((?!api|_next/static|_next/image|_vercel|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|mjs|map|txt|xml|json|pdf|mp4|ttf|otf|woff2?|webmanifest)$).*)",
  ],
};
