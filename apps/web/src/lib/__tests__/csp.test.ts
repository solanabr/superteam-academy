import { describe, it, expect } from "vitest";
import { buildCsp } from "@/lib/csp";

// buildCsp is what the MIDDLEWARE serves, and the middleware is what covers every
// HTML page (matcher excludes /api). The CSP in next.config.mjs is attached only
// to /api/:path* — JSON responses, which are not a clickjacking target.
//
// So this file is the only thing standing between us and shipping a clickjacking
// "fix" that lands exclusively on the surface where it does nothing. That is not
// hypothetical: it is exactly what happened in the first cut of #437, which
// tightened next.config.mjs and left this untouched.
describe("page CSP (the one middleware actually serves)", () => {
  const csp = buildCsp("test-nonce");
  const directive = (name: string) =>
    csp
      .split(";")
      .map((d) => d.trim())
      .find((d) => d.startsWith(name));

  it("forbids framing outright — frame-ancestors 'none' (#437)", () => {
    // 'self' would still permit same-origin framing, and per CSP Level 2 §7.4.1
    // browsers IGNORE X-Frame-Options whenever frame-ancestors is present — so
    // the global X-Frame-Options: DENY cannot compensate for a lax value here.
    expect(directive("frame-ancestors")).toBe("frame-ancestors 'none'");
  });

  it("still lets the app frame its own video embeds", () => {
    // frame-ancestors governs who may frame US; frame-src governs whom WE frame.
    // Conflating them would break every lesson video.
    const frameSrc = directive("frame-src");
    expect(frameSrc).toContain("https://www.youtube.com");
    expect(frameSrc).toContain("https://player.vimeo.com");
  });

  it("allows the Dynamic embedded-wallet origins (read from the SDK, not guessed)", () => {
    // connect-src: the SDK's API + telemetry. Without these every sign-in dies
    // as a CSP violation before Dynamic's flow can open — the same failure mode
    // this file's header warns about: a change that lands only where it does
    // nothing. Pinned exact hosts, never *.dynamicauth.com.
    const connectSrc = directive("connect-src");
    expect(connectSrc).toContain("https://app.dynamicauth.com");
    expect(connectSrc).toContain("https://logs.dynamicauth.com");
    expect(connectSrc).not.toContain("*.dynamicauth.com");

    // frame-src: Dynamic's embedded-wallet webview. Unlike the Phantom SDK this
    // one DOES frame, so "frame-src is untouched" stopped being true here.
    expect(directive("frame-src")).toContain("https://webview.dynamicauth.com");
  });

  it("carries no leftover Phantom origins", () => {
    // The Phantom allowances died with the integration; a stale origin is
    // silent attack surface that nothing exercises.
    expect(csp).not.toContain("phantom.app");
  });

  it("keeps the other hardening directives", () => {
    expect(directive("object-src")).toBe("object-src 'none'");
    expect(directive("base-uri")).toBe("base-uri 'self'");
  });

  it("threads the per-request nonce into script-src", () => {
    expect(buildCsp("abc123")).toContain("'nonce-abc123'");
  });
});
