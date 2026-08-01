import { describe, it, expect, vi, afterEach } from "vitest";

// NEXT_PUBLIC_APP_URL is interpolated into strings that get PINNED ON-CHAIN
// (certificate metadata URI / external_url). Unset, the `?? ""` fallbacks at
// those sites mint a RELATIVE URI into an immutable Metaplex Core asset. The
// public env schema must therefore make "unset in production" unreachable,
// while still defaulting in dev/test so `pnpm dev` and the suites just work.

async function importEnv() {
  vi.resetModules();
  return import("@/lib/env");
}

describe("env — NEXT_PUBLIC_APP_URL", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  });

  it("defaults to the documented localhost origin in dev/test", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    const { env } = await importEnv();
    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
  });

  it("uses the configured value when set", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://academy.example.com");
    const { env } = await importEnv();
    expect(env.NEXT_PUBLIC_APP_URL).toBe("https://academy.example.com");
  });

  it("throws at boot when unset in production (no relative on-chain URI)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    await expect(importEnv()).rejects.toThrow(/NEXT_PUBLIC_APP_URL/);
  });

  it("throws on a non-absolute value (a path is not an origin)", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "/certificates");
    await expect(importEnv()).rejects.toThrow(/NEXT_PUBLIC_APP_URL/);
  });
});
