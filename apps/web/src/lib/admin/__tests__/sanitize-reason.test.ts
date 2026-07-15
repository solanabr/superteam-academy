import { describe, it, expect } from "vitest";
import { sanitizeReason } from "../sanitize-reason";

describe("sanitizeReason", () => {
  it("redacts an api-keyed RPC URL", () => {
    const out = sanitizeReason(
      "boom at https://rpc.example/?api-key=SECRET and more"
    );
    expect(out).not.toMatch(/rpc\.example/);
    expect(out).not.toMatch(/SECRET/);
    expect(out).toContain("[redacted-url]");
  });

  it("redacts a leftover api-key query param not inside a URL match", () => {
    const out = sanitizeReason("params: ?api-key=abc123 leaked");
    expect(out).not.toMatch(/abc123/);
    expect(out).toContain("[redacted-api-key]");
  });

  it("redacts the SOLANA_RPC_URL env identifier", () => {
    const out = sanitizeReason("missing env SOLANA_RPC_URL at boot");
    expect(out).not.toMatch(/SOLANA_RPC_URL/);
    expect(out).toContain("[redacted-env]");
  });

  it("redacts the PROGRAM_AUTHORITY_SECRET env identifier", () => {
    const out = sanitizeReason("missing env PROGRAM_AUTHORITY_SECRET at boot");
    expect(out).not.toMatch(/PROGRAM_AUTHORITY_SECRET/);
    expect(out).toContain("[redacted-env]");
  });

  it("leaves an ordinary message untouched", () => {
    expect(sanitizeReason("Failed to fetch")).toBe("Failed to fetch");
  });

  // ── GitHub credential redaction (WS-B one-click publish) ──────────────────
  it("redacts an x-access-token git-credential in a codeload URL", () => {
    const out = sanitizeReason(
      "fetch failed: https://x-access-token:ghs_TopSecretToken@codeload.github.com/x/y"
    );
    expect(out).not.toMatch(/ghs_TopSecretToken/);
    // The whole tokened URL is redacted by the URL rule; the userinfo rule also
    // fires first so the raw token never survives either way.
    expect(out).not.toMatch(/codeload/);
  });

  it("redacts a bare x-access-token:<tok> pair outside a URL", () => {
    const out = sanitizeReason(
      "git said x-access-token:ghs_abc123DEF and died"
    );
    expect(out).not.toMatch(/ghs_abc123DEF/);
    expect(out).toContain("x-access-token:[redacted-token]");
  });

  it("redacts a Bearer authorization value", () => {
    const out = sanitizeReason(
      "header Authorization: Bearer ghp_LiveTokenXYZ nope"
    );
    expect(out).not.toMatch(/ghp_LiveTokenXYZ/);
    expect(out).toContain("Bearer [redacted-token]");
  });

  it("redacts a `token <tok>` authorization value", () => {
    const out = sanitizeReason("used token ghp_SecretPatValue for the push");
    expect(out).not.toMatch(/ghp_SecretPatValue/);
    expect(out).toContain("token [redacted-token]");
  });

  it("redacts a tokened GitHub API URL", () => {
    const out = sanitizeReason(
      "GitHub GET https://api.github.com/repos/x/y?token=ghs_LeakInQuery → 403"
    );
    expect(out).not.toMatch(/ghs_LeakInQuery/);
    expect(out).not.toMatch(/api\.github\.com/);
    expect(out).toContain("[redacted-url]");
  });

  it("redacts the GITHUB_PUBLISH_TOKEN / GITHUB_TOKEN env identifiers", () => {
    expect(sanitizeReason("GITHUB_PUBLISH_TOKEN is not configured")).toBe(
      "[redacted-env] is not configured"
    );
    expect(sanitizeReason("GITHUB_TOKEN missing")).toBe(
      "[redacted-env] missing"
    );
  });

  it("does not treat the word inside GITHUB_TOKEN as a bare `token` header", () => {
    // No word boundary before TOKEN in GITHUB_TOKEN, so the header rule must not
    // fire — the env rule handles it cleanly.
    const out = sanitizeReason("env GITHUB_TOKEN unset");
    expect(out).toBe("env [redacted-env] unset");
  });
});
