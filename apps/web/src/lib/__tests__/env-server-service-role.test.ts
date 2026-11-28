import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

async function importServerEnv() {
  vi.resetModules();
  return import("@/lib/env.server");
}

// Every server variable a deployment outside production can boot without.
const OPTIONAL_OUTSIDE_PRODUCTION = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "BACKEND_SIGNER_SECRET",
  "PROGRAM_AUTHORITY_SECRET",
  "BUILD_SERVER_URL",
  "BUILD_SERVER_API_KEY",
  "GEMINI_API_KEY",
  "HELIUS_WEBHOOK_SECRET",
  "TEACH_PREVIEW_PASSWORD",
  "BLOB_READ_WRITE_TOKEN",
  "SENTRY_AUTH_TOKEN",
];

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("serverEnv: SUPABASE_SERVICE_ROLE_KEY", () => {
  it.each([undefined, ""])("fails boot in production for %j", async (value) => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", value);
    await expect(importServerEnv()).rejects.toThrow(
      /SUPABASE_SERVICE_ROLE_KEY/
    );
  });

  it("boots in production with the key", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role");
    const { serverEnv } = await importServerEnv();
    expect(serverEnv.SUPABASE_SERVICE_ROLE_KEY).toBe("service-role");
  });

  it.each([
    ["preview", undefined],
    ["preview", ""],
    ["development", undefined],
    [undefined, undefined],
  ])(
    "boots outside production (VERCEL_ENV %j) for %j",
    async (deployment, value) => {
      vi.stubEnv("VERCEL_ENV", deployment);
      vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", value);
      const { serverEnv } = await importServerEnv();
      expect(serverEnv.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
    }
  );

  it("boots on a preview with none of the optional server variables", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    for (const name of OPTIONAL_OUTSIDE_PRODUCTION) vi.stubEnv(name, undefined);
    const { serverEnv } = await importServerEnv();
    expect(serverEnv.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
    expect(serverEnv.BACKEND_SIGNER_SECRET).toBeUndefined();
    expect(serverEnv.BUILD_SERVER_URL).toBeUndefined();
  });
});
