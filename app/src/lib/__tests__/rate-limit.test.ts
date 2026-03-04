import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// The rate-limit module uses a module-level Map. To get a clean slate between
// tests we re-import the module by using vi.isolateModules so each test block
// gets its own Map instance, or we rely on distinct keys per test to avoid
// cross-test interference. The simplest, most robust approach is to use
// vi.isolateModules inside each test group. However, since vi.isolateModules
// requires dynamic imports (async), we use unique keys per describe block to
// isolate tests without resetting internal state.

describe("rate-limit: checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows the first request for a key", async () => {
    const { checkRateLimit } = await import("../rate-limit");
    const key = `test-allow-first-${Math.random()}`;
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
  });

  it("allows requests up to the limit", async () => {
    const { checkRateLimit } = await import("../rate-limit");
    const key = `test-up-to-limit-${Math.random()}`;
    const limit = 5;
    for (let i = 0; i < limit; i++) {
      expect(checkRateLimit(key, limit, 60_000)).toBe(true);
    }
  });

  it("blocks the request that exceeds the limit", async () => {
    const { checkRateLimit } = await import("../rate-limit");
    const key = `test-block-over-${Math.random()}`;
    const limit = 3;
    // Exhaust the limit
    for (let i = 0; i < limit; i++) {
      checkRateLimit(key, limit, 60_000);
    }
    // Next call should be blocked
    expect(checkRateLimit(key, limit, 60_000)).toBe(false);
  });

  it("continues to block after multiple over-limit calls", async () => {
    const { checkRateLimit } = await import("../rate-limit");
    const key = `test-block-multiple-${Math.random()}`;
    const limit = 2;
    checkRateLimit(key, limit, 60_000);
    checkRateLimit(key, limit, 60_000);
    expect(checkRateLimit(key, limit, 60_000)).toBe(false);
    expect(checkRateLimit(key, limit, 60_000)).toBe(false);
  });

  it("resets after the window expires", async () => {
    const { checkRateLimit } = await import("../rate-limit");
    const key = `test-reset-${Math.random()}`;
    const limit = 2;
    const windowMs = 1_000;

    // Exhaust the limit
    checkRateLimit(key, limit, windowMs);
    checkRateLimit(key, limit, windowMs);
    expect(checkRateLimit(key, limit, windowMs)).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(windowMs + 1);

    // Should be allowed again
    expect(checkRateLimit(key, limit, windowMs)).toBe(true);
  });

  it("is independent per key", async () => {
    const { checkRateLimit } = await import("../rate-limit");
    const keyA = `test-key-a-${Math.random()}`;
    const keyB = `test-key-b-${Math.random()}`;
    const limit = 1;

    // Exhaust limit for keyA only
    checkRateLimit(keyA, limit, 60_000);
    expect(checkRateLimit(keyA, limit, 60_000)).toBe(false);

    // keyB should still be allowed
    expect(checkRateLimit(keyB, limit, 60_000)).toBe(true);
  });

  it("allows a limit of 1 (exactly one request per window)", async () => {
    const { checkRateLimit } = await import("../rate-limit");
    const key = `test-limit-1-${Math.random()}`;
    expect(checkRateLimit(key, 1, 60_000)).toBe(true);
    expect(checkRateLimit(key, 1, 60_000)).toBe(false);
  });

  it("returns true exactly at window boundary and allows requests in the new window", async () => {
    const { checkRateLimit } = await import("../rate-limit");
    const key = `test-boundary-${Math.random()}`;
    const limit = 1;
    const windowMs = 500;

    checkRateLimit(key, limit, windowMs);

    // Just before reset — still blocked
    vi.advanceTimersByTime(windowMs - 1);
    expect(checkRateLimit(key, limit, windowMs)).toBe(false);

    // One more ms — past the reset
    vi.advanceTimersByTime(2);
    expect(checkRateLimit(key, limit, windowMs)).toBe(true);
  });
});
