import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

const ORIGINAL_SEAL_SECRET = process.env.AI_PARTNER_SEAL_SECRET;
const ORIGINAL_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

beforeEach(() => {
  vi.resetModules();
  process.env.AI_PARTNER_SEAL_SECRET = "test-seal-secret-value";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
});

afterEach(() => {
  if (ORIGINAL_SEAL_SECRET === undefined)
    delete process.env.AI_PARTNER_SEAL_SECRET;
  else process.env.AI_PARTNER_SEAL_SECRET = ORIGINAL_SEAL_SECRET;
  if (ORIGINAL_SERVICE_ROLE_KEY === undefined)
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = ORIGINAL_SERVICE_ROLE_KEY;
});

describe("check-seal", () => {
  it("round-trips a valid payload", async () => {
    const { sealCheck, openCheck } = await import("../check-seal");
    const payload = { correctIndex: 1 as const, explanation: "because B" };
    const token = sealCheck(payload);
    expect(typeof token).toBe("string");
    expect(openCheck(token)).toEqual(payload);
  });

  it("produces a different token each call (fresh IV)", async () => {
    const { sealCheck } = await import("../check-seal");
    const payload = { correctIndex: 0 as const, explanation: "x" };
    const a = sealCheck(payload);
    const b = sealCheck(payload);
    expect(a).not.toBe(b);
  });

  it("returns null for a tampered token (flipped byte)", async () => {
    const { sealCheck, openCheck } = await import("../check-seal");
    const token = sealCheck({ correctIndex: 2, explanation: "e" });
    const buf = Buffer.from(token, "base64url");
    // Flip a byte well inside the ciphertext region (past iv[12] + tag[16]).
    buf[buf.length - 1] = buf[buf.length - 1]! ^ 0xff;
    const tampered = buf.toString("base64url");
    expect(openCheck(tampered)).toBeNull();
  });

  it("returns null for garbage input", async () => {
    const { openCheck } = await import("../check-seal");
    expect(openCheck("not-a-real-token")).toBeNull();
  });

  it("returns null for an empty string", async () => {
    const { openCheck } = await import("../check-seal");
    expect(openCheck("")).toBeNull();
  });

  it("returns null for a token sealed under a different key", async () => {
    const { sealCheck } = await import("../check-seal");
    const token = sealCheck({ correctIndex: 1, explanation: "e" });

    vi.resetModules();
    process.env.AI_PARTNER_SEAL_SECRET = "a-completely-different-secret";
    const { openCheck: openWithDifferentKey } = await import("../check-seal");

    expect(openWithDifferentKey(token)).toBeNull();
  });

  it("falls back to SUPABASE_SERVICE_ROLE_KEY when AI_PARTNER_SEAL_SECRET is unset", async () => {
    delete process.env.AI_PARTNER_SEAL_SECRET;
    const { sealCheck, openCheck } = await import("../check-seal");
    const payload = { correctIndex: 0 as const, explanation: "fallback" };
    const token = sealCheck(payload);
    expect(openCheck(token)).toEqual(payload);
  });
});
