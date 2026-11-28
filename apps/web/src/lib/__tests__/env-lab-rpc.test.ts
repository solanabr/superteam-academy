import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

const DEVNET = "https://api.devnet.solana.com";

async function importEnv() {
  vi.resetModules();
  return import("@/lib/env");
}

async function importServerEnv() {
  vi.resetModules();
  return import("@/lib/env.server");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("env: NEXT_PUBLIC_LAB_RPC_URL", () => {
  it.each([undefined, ""])(
    "defaults to public devnet for %j",
    async (value) => {
      vi.stubEnv("NEXT_PUBLIC_LAB_RPC_URL", value);
      const { env } = await importEnv();
      expect(env.NEXT_PUBLIC_LAB_RPC_URL).toBe(DEVNET);
    }
  );

  it("uses the configured value when set", async () => {
    vi.stubEnv("NEXT_PUBLIC_LAB_RPC_URL", "https://devnet.rpc.example.com");
    const { env } = await importEnv();
    expect(env.NEXT_PUBLIC_LAB_RPC_URL).toBe("https://devnet.rpc.example.com");
  });

  it.each(["devnet", "wss://api.devnet.solana.com"])(
    "throws at boot on %j, which is not an http(s) URL",
    async (value) => {
      vi.stubEnv("NEXT_PUBLIC_LAB_RPC_URL", value);
      await expect(importEnv()).rejects.toThrow(/NEXT_PUBLIC_LAB_RPC_URL/);
    }
  );
});

describe("serverEnv: LAB_RPC_URL", () => {
  it.each([undefined, ""])(
    "defaults to public devnet for %j",
    async (value) => {
      vi.stubEnv("LAB_RPC_URL", value);
      const { serverEnv } = await importServerEnv();
      expect(serverEnv.LAB_RPC_URL).toBe(DEVNET);
    }
  );

  it("uses the configured value when set", async () => {
    vi.stubEnv("LAB_RPC_URL", "https://devnet.rpc.example.com");
    const { serverEnv } = await importServerEnv();
    expect(serverEnv.LAB_RPC_URL).toBe("https://devnet.rpc.example.com");
  });

  it.each(["devnet", "wss://api.devnet.solana.com"])(
    "throws at boot on %j, which is not an http(s) URL",
    async (value) => {
      vi.stubEnv("LAB_RPC_URL", value);
      await expect(importServerEnv()).rejects.toThrow(/LAB_RPC_URL/);
    }
  );
});
