import { describe, it, expect, beforeEach, vi } from "vitest";

describe("isRateLimitedExpress", () => {
  let isRateLimitedExpress: typeof import("./rate-limit").isRateLimitedExpress;

  beforeEach(async () => {
    vi.useFakeTimers();
    // Fresh module for each test to reset the store Map
    vi.resetModules();
    const mod = await import("./rate-limit");
    isRateLimitedExpress = mod.isRateLimitedExpress;
  });

  it("allows first request", () => {
    expect(isRateLimitedExpress("1.2.3.4", "key1")).toBe(false);
  });

  it("blocks second request within window", () => {
    isRateLimitedExpress("1.2.3.4", "key1");
    expect(isRateLimitedExpress("1.2.3.4", "key1")).toBe(true);
  });

  it("tracks different keys independently", () => {
    expect(isRateLimitedExpress("1.2.3.4", "keyA")).toBe(false);
    expect(isRateLimitedExpress("1.2.3.4", "keyB")).toBe(false);
  });

  it("tracks different IPs independently", () => {
    expect(isRateLimitedExpress("1.1.1.1", "key1")).toBe(false);
    expect(isRateLimitedExpress("2.2.2.2", "key1")).toBe(false);
  });

  it("respects custom windowMs", () => {
    isRateLimitedExpress("1.2.3.4", "key1", 10);
    expect(isRateLimitedExpress("1.2.3.4", "key1", 10)).toBe(true);
  });

  it("allows request after window expires", () => {
    isRateLimitedExpress("1.2.3.4", "key1", 1000);
    vi.advanceTimersByTime(1001);
    expect(isRateLimitedExpress("1.2.3.4", "key1", 1000)).toBe(false);
  });

  it("blocks burst after first request", () => {
    const results: boolean[] = [];
    for (let i = 0; i < 10; i++) {
      results.push(isRateLimitedExpress("1.2.3.4", "burst"));
    }
    expect(results[0]).toBe(false);
    expect(results.slice(1).every(Boolean)).toBe(true);
  });

  it("still blocked just before window expires", () => {
    isRateLimitedExpress("1.2.3.4", "key1", 5000);
    vi.advanceTimersByTime(4999);
    expect(isRateLimitedExpress("1.2.3.4", "key1", 5000)).toBe(true);
  });
});
