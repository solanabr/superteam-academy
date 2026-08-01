/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the module imports so the `server-only` graph loads under vitest. */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  isPreviewConfigured,
  isValidPreviewPassword,
  isValidPreviewSession,
  mintPreviewSession,
  requirePreviewAuth,
  TeachPreviewAuthError,
  TEACH_PREVIEW_COOKIE,
  TEACH_PREVIEW_MAX_AGE_MS,
} from "../preview-auth";

function reqWithCookie(value: string | null): Request {
  return new Request("https://example.test/api/teach/preview", {
    method: "POST",
    headers: value ? { cookie: `${TEACH_PREVIEW_COOKIE}=${value}` } : {},
  });
}

describe("preview password", () => {
  afterEach(() => {
    delete process.env.TEACH_PREVIEW_PASSWORD;
  });

  // The old literal "123" default shipped a guessable gate to every deployment
  // that forgot the env var. Unset now means DISABLED, not "weak".
  it("unset ⇒ the gate is closed: nothing satisfies it, including the old default", () => {
    delete process.env.TEACH_PREVIEW_PASSWORD;
    expect(isPreviewConfigured()).toBe(false);
    expect(isValidPreviewPassword("123")).toBe(false);
    expect(isValidPreviewPassword("")).toBe(false);
    expect(isValidPreviewPassword(undefined)).toBe(false);
  });

  it("blank ⇒ treated as unset (a Vercel placeholder does not open the gate)", () => {
    process.env.TEACH_PREVIEW_PASSWORD = "";
    expect(isPreviewConfigured()).toBe(false);
    expect(isValidPreviewPassword("")).toBe(false);
  });

  it("accepts only the configured password", () => {
    process.env.TEACH_PREVIEW_PASSWORD = "s3cret";
    expect(isPreviewConfigured()).toBe(true);
    expect(isValidPreviewPassword("s3cret")).toBe(true);
    expect(isValidPreviewPassword("123")).toBe(false);
    expect(isValidPreviewPassword("s3cre")).toBe(false);
    expect(isValidPreviewPassword(123)).toBe(false);
  });
});

describe("preview session cookie", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("round-trips a freshly minted session", () => {
    expect(isValidPreviewSession(mintPreviewSession())).toBe(true);
  });

  it("rejects missing, malformed, and unsigned values", () => {
    expect(isValidPreviewSession(undefined)).toBe(false);
    expect(isValidPreviewSession("")).toBe(false);
    expect(isValidPreviewSession("nodot")).toBe(false);
    expect(isValidPreviewSession(`${Date.now()}.deadbeef`)).toBe(false);
  });

  it("rejects a tampered timestamp (signature no longer matches)", () => {
    const [, sig] = mintPreviewSession().split(".");
    expect(isValidPreviewSession(`${Date.now() + 5_000}.${sig}`)).toBe(false);
  });

  it("expires after the max age", () => {
    const cookie = mintPreviewSession();
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + TEACH_PREVIEW_MAX_AGE_MS + 1_000);
    expect(isValidPreviewSession(cookie)).toBe(false);
  });

  it("requirePreviewAuth throws without a valid cookie and passes with one", () => {
    expect(() => requirePreviewAuth(reqWithCookie(null))).toThrow(
      TeachPreviewAuthError
    );
    expect(() =>
      requirePreviewAuth(reqWithCookie(mintPreviewSession()))
    ).not.toThrow();
  });
});
