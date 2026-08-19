/* eslint-disable import/order -- vi.mock calls must precede importing the module under test. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const { getClaims } = vi.hoisted(() => ({
  getClaims: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getClaims },
  }),
}));

// Pass-through stand-in — the auth logic under test runs BEFORE next-intl,
// so its own locale-prefixing logic is irrelevant here.
vi.mock("next-intl/middleware", () => ({
  default:
    () =>
    (request: NextRequest): NextResponse =>
      NextResponse.next({ request }),
}));

import { middleware, config } from "../middleware";

function pageRequest(path: string): NextRequest {
  return new NextRequest(`https://app.test${path}`);
}

function sessionFor(sub: string) {
  return { data: { claims: { sub } }, error: null };
}

beforeEach(() => {
  vi.clearAllMocks();
  getClaims.mockResolvedValue({ data: null, error: null });
});

describe("middleware — auth via getClaims (#1089)", () => {
  it("passes an anonymous request through on a public route", async () => {
    const res = await middleware(pageRequest("/en/courses"));
    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects an anonymous request on a protected route to the locale landing", async () => {
    const res = await middleware(pageRequest("/pt-BR/dashboard"));

    const location = res.headers.get("location");
    expect(location).not.toBeNull();
    expect(new URL(location!).pathname).toBe("/pt-BR");
  });

  it("passes an authenticated request through on a protected route", async () => {
    getClaims.mockResolvedValue(sessionFor("user-1"));

    const res = await middleware(pageRequest("/en/dashboard"));
    expect(res.headers.get("location")).toBeNull();
  });

  it("fails closed when getClaims returns no data (missing env, invalid JWT)", async () => {
    getClaims.mockResolvedValue({ data: null, error: null });

    const res = await middleware(pageRequest("/en/settings"));
    expect(res.headers.get("location")).not.toBeNull();
  });
});

describe("middleware — matcher (#1089 dotted page slugs)", () => {
  // Next.js compiles config.matcher as a path-to-regexp pattern; for this
  // shape it is equivalent to anchoring the inner regex. Testing the regex
  // directly documents which paths run middleware.
  const inner = config.matcher[0]!.replace(/^\/\((.*)\)$/, "$1");
  const matcher = new RegExp(`^/${inner}$`);

  it.each([
    "/en/courses/node.js-basics",
    "/en/courses/web3.0-intro",
    "/en/docs/v1.2-notes",
    "/en/dashboard",
    "/pt-BR/leaderboard",
  ])("runs middleware for page route %s", (path) => {
    expect(matcher.test(path)).toBe(true);
  });

  it.each([
    "/api/auth/callback",
    "/_next/static/chunks/main.js",
    "/_next/image",
    "/_vercel/insights",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
    "/images/logo.png",
    "/fonts/display.woff2",
    // PWA manifest — served by app/manifest.ts; routing it through next-intl
    // would 307 it to /en/manifest.webmanifest and 404 (adversarial review F3).
    "/manifest.webmanifest",
    "/icons/icon.avif",
  ])("skips middleware for %s", (path) => {
    expect(matcher.test(path)).toBe(false);
  });
});
