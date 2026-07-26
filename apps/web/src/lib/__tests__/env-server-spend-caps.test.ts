import { describe, it, expect, vi, afterEach } from "vitest";

// #724 minor: a hard spend cap of $0 denies every request (self-DoS). It is
// "safe" under fail-closed but silent, so env.server must reject it LOUDLY at
// boot. Soft caps of 0 are legitimate (always-degrade) and must still boot.
vi.mock("server-only", () => ({}));

const HARD_CAP_VARS = [
  "AI_SPEND_GLOBAL_HARD_USD",
  "AI_SPEND_ACCOUNT_HARD_USD",
  "AI_SPEND_IP_HARD_USD",
] as const;

async function importEnvServer() {
  vi.resetModules();
  return import("@/lib/env.server");
}

describe("env.server — AI spend hard caps (#724)", () => {
  afterEach(() => {
    for (const v of HARD_CAP_VARS) delete process.env[v];
    delete process.env.AI_SPEND_GLOBAL_SOFT_USD;
  });

  it("boots on the defaults (no override)", async () => {
    await expect(importEnvServer()).resolves.toBeDefined();
  });

  it.each(HARD_CAP_VARS)(
    "rejects %s = 0 at boot (self-DoS guard)",
    async (v) => {
      process.env[v] = "0";
      await expect(importEnvServer()).rejects.toThrow();
    }
  );

  it("accepts a positive hard-cap override", async () => {
    process.env.AI_SPEND_GLOBAL_HARD_USD = "30";
    await expect(importEnvServer()).resolves.toBeDefined();
  });

  it("still accepts a SOFT cap of 0 (always-degrade is allowed, not a DoS)", async () => {
    process.env.AI_SPEND_GLOBAL_SOFT_USD = "0";
    await expect(importEnvServer()).resolves.toBeDefined();
  });
});
