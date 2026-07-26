import { describe, it, expect } from "vitest";
import { buildOAuthRedirect, isSafeNextPath } from "../oauth-redirect";

const ORIGIN = "https://academy.superteam.fun";
const CALLBACK = `${ORIGIN}/api/auth/callback`;

// Values `window.location.pathname` cannot legitimately produce but which the
// guard must still refuse (defense in depth for the open-redirect surface).
const HOSTILE_PATHS = [
  "//evil.com", // protocol-relative
  "//evil.com/path",
  "/\\evil.com", // backslash host bypass
  "/path\\to", // stray backslash
  "https://evil.com", // absolute URL (no leading slash + scheme)
  "javascript:alert(1)", // scheme injection
  "/a:b", // any colon → drop (mirrors the callback sanitizer)
  "/", // adds nothing over the callback default
  "", // empty
];

describe("isSafeNextPath", () => {
  it("accepts a normal same-origin lesson path", () => {
    expect(isSafeNextPath("/en/courses/solana-101/lessons/intro")).toBe(true);
  });

  it("rejects protocol-relative, scheme, and backslash paths", () => {
    for (const p of HOSTILE_PATHS) {
      expect(isSafeNextPath(p)).toBe(false);
    }
  });
});

describe("buildOAuthRedirect", () => {
  it("appends a `next` that round-trips a normal pathname", () => {
    const path = "/pt-BR/courses/solana-101/lessons/intro";
    const out = buildOAuthRedirect(ORIGIN, path);

    const url = new URL(out);
    expect(url.origin).toBe(ORIGIN); // same origin as the callback
    expect(url.pathname).toBe("/api/auth/callback");
    expect(url.searchParams.get("next")).toBe(path); // decodes back exactly
  });

  it("drops the `next` entirely for any unsafe pathname", () => {
    for (const p of HOSTILE_PATHS) {
      expect(buildOAuthRedirect(ORIGIN, p)).toBe(CALLBACK);
    }
  });

  it("only ever emits a same-origin, path-shaped `next` (never //, a scheme, or a backslash)", () => {
    const probes = [
      "/en/dashboard",
      ...HOSTILE_PATHS,
      "/en/courses/x/lessons/y",
    ];
    for (const p of probes) {
      const url = new URL(buildOAuthRedirect(ORIGIN, p));
      // The callback target is always same-origin.
      expect(url.origin).toBe(ORIGIN);
      const next = url.searchParams.get("next");
      if (next !== null) {
        expect(next.startsWith("/")).toBe(true);
        expect(next.startsWith("//")).toBe(false);
        expect(next).not.toContain(":");
        expect(next).not.toContain("\\");
      }
    }
  });
});
