import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { env } from "@/lib/env";
import { locales, defaultLocale } from "@/lib/i18n/config";
import { ADMIN_SESSION_MAX_AGE_MS } from "@/lib/admin/session-format";
import { buildCsp, generateNonce } from "@/lib/csp";

// NOTE: This Edge-runtime `isValidAdminSession` (Web Crypto) must stay in sync
// with the Node-runtime implementation in `lib/admin/auth.ts` (Node `crypto`).
// The shared cookie format + max-age live in `lib/admin/session-format.ts`.

function hexEncode(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function isValidAdminSession(
  cookieValue: string | undefined
): Promise<boolean> {
  if (!cookieValue) return false;
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;

  const dotIndex = cookieValue.indexOf(".");
  if (dotIndex === -1) return false;

  const timestamp = cookieValue.slice(0, dotIndex);
  const signature = cookieValue.slice(dotIndex + 1);

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(timestamp));
  const expectedSig = hexEncode(sig);

  if (!timingSafeEqual(signature, expectedSig)) return false;

  const age = Date.now() - Number(timestamp);
  if (Number.isNaN(age) || age < 0 || age > ADMIN_SESSION_MAX_AGE_MS)
    return false;

  return true;
}

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

function isAdminRoute(pathname: string): boolean {
  for (const locale of locales) {
    const prefix = `/${locale}`;
    if (pathname.startsWith(prefix)) {
      const rest = pathname.slice(prefix.length);
      return rest === "/admin" || rest.startsWith("/admin/");
    }
  }
  return false;
}

function isProtectedRoute(pathname: string): boolean {
  // Only routes that require authentication (personal data)
  // Public routes (/courses, /leaderboard, /certificates/[id]) are NOT listed here
  const protectedPaths = ["/dashboard", "/settings"];

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

  // IMPORTANT: getUser() may trigger token refresh which calls setAll
  // If Supabase env vars are missing, this will fail and user will be null
  // which causes platform routes to redirect (fail-closed behavior)
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  // Admin routes: check admin_session cookie (separate from Supabase session)
  // The /admin page renders its own login form when the cookie is absent,
  // so sub-routes that need protection redirect back to /admin.
  if (isAdminRoute(request.nextUrl.pathname)) {
    const adminSession = request.cookies.get("admin_session");
    const isAdminRoot = /^\/[a-z-]+\/admin\/?$/.test(request.nextUrl.pathname);
    if (!(await isValidAdminSession(adminSession?.value))) {
      if (!isAdminRoot) {
        const locale =
          locales.find((l) => request.nextUrl.pathname.startsWith(`/${l}`)) ??
          defaultLocale;
        const adminRedirect = NextResponse.redirect(
          new URL(`/${locale}/admin`, request.url)
        );
        adminRedirect.headers.set("Content-Security-Policy", csp);
        return adminRedirect;
      }
    }
    return intlResponse;
  }

  // For platform routes, check auth (fail-closed: no user = redirect)
  if (isProtectedRoute(request.nextUrl.pathname)) {
    if (!user) {
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
  matcher: ["/((?!api|_next|_vercel|studio|.*\\..*).*)"],
};
