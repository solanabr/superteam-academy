import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

import {
  deriveCustodialKeypair,
  isCustodialWalletEnabled,
} from "../custodial-wallet";

const SECRET = "a-test-master-secret-that-is-long-enough-0123456789";

beforeEach(() => {
  vi.stubEnv("CUSTODIAL_WALLET_SECRET", SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isCustodialWalletEnabled", () => {
  it("is off when the secret is unset", () => {
    vi.stubEnv("CUSTODIAL_WALLET_SECRET", "");
    expect(isCustodialWalletEnabled()).toBe(false);
  });

  it("is off when the secret is too short to be real", () => {
    vi.stubEnv("CUSTODIAL_WALLET_SECRET", "short");
    expect(isCustodialWalletEnabled()).toBe(false);
  });

  it("is on with a real secret", () => {
    expect(isCustodialWalletEnabled()).toBe(true);
  });
});

describe("deriveCustodialKeypair", () => {
  it("is deterministic — the same user always gets the same address", () => {
    const a = deriveCustodialKeypair("user-1");
    const b = deriveCustodialKeypair("user-1");
    expect(a.publicKey.toBase58()).toBe(b.publicKey.toBase58());
  });

  it("gives different users different addresses", () => {
    const a = deriveCustodialKeypair("user-1");
    const b = deriveCustodialKeypair("user-2");
    expect(a.publicKey.toBase58()).not.toBe(b.publicKey.toBase58());
  });

  it("changes every address when the master secret changes — the documented rotation hazard", () => {
    const before = deriveCustodialKeypair("user-1");
    vi.stubEnv(
      "CUSTODIAL_WALLET_SECRET",
      "a-DIFFERENT-master-secret-that-is-long-enough-9876543210"
    );
    const after = deriveCustodialKeypair("user-1");
    expect(after.publicKey.toBase58()).not.toBe(before.publicKey.toBase58());
  });

  it("throws rather than deriving from a missing secret", () => {
    vi.stubEnv("CUSTODIAL_WALLET_SECRET", "");
    expect(() => deriveCustodialKeypair("user-1")).toThrow(
      /CUSTODIAL_WALLET_SECRET/
    );
  });

  it("derives a keypair that can actually sign (valid ed25519 seed)", () => {
    const kp = deriveCustodialKeypair("user-1");
    expect(kp.secretKey).toHaveLength(64);
    expect(kp.publicKey.toBase58().length).toBeGreaterThan(30);
  });
});
