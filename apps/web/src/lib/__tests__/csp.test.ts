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

  it("still lets the app frame its own video embeds (frame-src is untouched)", () => {
    // frame-ancestors governs who may frame US; frame-src governs whom WE frame.
    // Conflating them would break every lesson video.
    const frameSrc = directive("frame-src");
    expect(frameSrc).toContain("https://www.youtube.com");
    expect(frameSrc).toContain("https://player.vimeo.com");
  });

  it("keeps the other hardening directives", () => {
    expect(directive("object-src")).toBe("object-src 'none'");
    expect(directive("base-uri")).toBe("base-uri 'self'");
  });

  it("threads the per-request nonce into script-src", () => {
    expect(buildCsp("abc123")).toContain("'nonce-abc123'");
  });
});
