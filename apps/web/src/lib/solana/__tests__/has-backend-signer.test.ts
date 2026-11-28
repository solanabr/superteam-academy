import { describe, it, expect, vi } from "vitest";
import { Keypair } from "@solana/web3.js";

const h = vi.hoisted(() => ({
  serverEnv: { SOLANA_RPC_URL: "http://localhost:8899" } as Record<
    string,
    string | undefined
  >,
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env.server", () => ({ serverEnv: h.serverEnv }));

// A fresh module per case: the signer is a lazy singleton.
async function hasBackendSigner(secret: string | undefined): Promise<boolean> {
  h.serverEnv.BACKEND_SIGNER_SECRET = secret;
  vi.resetModules();
  return (await import("../academy-program")).hasBackendSigner();
}

describe("hasBackendSigner", () => {
  it("is false when the signer key is unset", async () => {
    expect(await hasBackendSigner(undefined)).toBe(false);
  });

  it("is false, without throwing, when the signer key does not load", async () => {
    expect(await hasBackendSigner("not json")).toBe(false);
    expect(await hasBackendSigner("[1,2,3]")).toBe(false);
  });

  it("is true when the signer key loads", async () => {
    const secret = JSON.stringify(Array.from(Keypair.generate().secretKey));
    expect(await hasBackendSigner(secret)).toBe(true);
  });
});
