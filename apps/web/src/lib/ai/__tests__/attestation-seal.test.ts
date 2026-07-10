import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

const ORIG_SEAL = process.env.AI_PARTNER_SEAL_SECRET;
const ORIG_SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;

beforeEach(() => {
  vi.resetModules();
  process.env.AI_PARTNER_SEAL_SECRET = "test-seal-secret";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
});
afterEach(() => {
  if (ORIG_SEAL === undefined) delete process.env.AI_PARTNER_SEAL_SECRET;
  else process.env.AI_PARTNER_SEAL_SECRET = ORIG_SEAL;
  if (ORIG_SRK === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = ORIG_SRK;
});

const future = () => Date.now() + 5 * 60_000;
const expect3 = {
  lessonId: "lesson-accounts",
  blockKey: "reflect",
  userId: "user-1",
};

describe("attestation-seal", () => {
  it("accepts a matching, unexpired attestation", async () => {
    const { sealAttestation, openAttestation } = await import("../check-seal");
    const token = sealAttestation({ ...expect3, exp: future() });
    expect(openAttestation(token, expect3)).toBe(true);
  });

  it("REJECTS replay into a different lesson", async () => {
    const { sealAttestation, openAttestation } = await import("../check-seal");
    const token = sealAttestation({ ...expect3, exp: future() });
    expect(
      openAttestation(token, { ...expect3, lessonId: "lesson-pdas" })
    ).toBe(false);
  });

  it("REJECTS replay by a different user (the core exploit)", async () => {
    const { sealAttestation, openAttestation } = await import("../check-seal");
    const token = sealAttestation({ ...expect3, exp: future() });
    expect(openAttestation(token, { ...expect3, userId: "attacker" })).toBe(
      false
    );
  });

  it("REJECTS a different block key", async () => {
    const { sealAttestation, openAttestation } = await import("../check-seal");
    const token = sealAttestation({ ...expect3, exp: future() });
    expect(openAttestation(token, { ...expect3, blockKey: "other" })).toBe(
      false
    );
  });

  it("REJECTS an expired attestation", async () => {
    const { sealAttestation, openAttestation } = await import("../check-seal");
    const token = sealAttestation({ ...expect3, exp: Date.now() - 1_000 });
    expect(openAttestation(token, expect3)).toBe(false);
  });

  it("REJECTS a tampered token", async () => {
    const { sealAttestation, openAttestation } = await import("../check-seal");
    const token = sealAttestation({ ...expect3, exp: future() });
    const buf = Buffer.from(token, "base64url");
    buf[buf.length - 1] = buf[buf.length - 1]! ^ 0xff;
    expect(openAttestation(buf.toString("base64url"), expect3)).toBe(false);
  });

  it("does NOT open a SealedCheck token as an attestation (domain separation)", async () => {
    const { sealCheck, openAttestation } = await import("../check-seal");
    const checkToken = sealCheck({ correctIndex: 1, explanation: "x" });
    expect(openAttestation(checkToken, expect3)).toBe(false);
  });

  it("THROWS when no seal secret is configured (never HMACs the empty string)", async () => {
    delete process.env.AI_PARTNER_SEAL_SECRET;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { sealAttestation } = await import("../check-seal");
    expect(() => sealAttestation({ ...expect3, exp: future() })).toThrow();
  });
});
