import { describe, it, expect } from "vitest";
import { Instructor } from "../instructor";
import { SolanaAddress } from "../wallet";

const base = {
  id: "instructor-ana-santos",
  name: "Ana Santos",
  wallet: "B7o8NfV81HzjuZFWQTTx3Xdvh77Dqoajwib3kWEnvzJF", // real on-curve wallet
};

describe("Instructor", () => {
  it("accepts a minimal instructor with an on-curve wallet", () => {
    expect(Instructor.parse(base).wallet).toBe(base.wallet);
  });

  it("requires a wallet", () => {
    const { wallet, ...noWallet } = base;
    void wallet;
    expect(Instructor.safeParse(noWallet).success).toBe(false);
  });

  it("defaults socialLinks to an empty object", () => {
    expect(Instructor.parse(base).socialLinks).toEqual({});
  });
});

describe("SolanaAddress", () => {
  it("accepts an on-curve ed25519 address", () => {
    expect(
      SolanaAddress.safeParse("B7o8NfV81HzjuZFWQTTx3Xdvh77Dqoajwib3kWEnvzJF")
        .success
    ).toBe(true);
  });

  it("rejects a 32-byte OFF-curve address (a PDA)", () => {
    // Co24… is a real PDA — valid base58, exactly 32 bytes, but not on the curve.
    // getAssociatedTokenAddressSync would refuse it as a reward owner.
    expect(
      SolanaAddress.safeParse("Co24yjRpSdUBaycV24uZe9j7PnAqVmdiTrHqesV5U4XT")
        .success
    ).toBe(false);
  });

  it("rejects non-base58 and wrong-length strings", () => {
    expect(SolanaAddress.safeParse("not a wallet").success).toBe(false);
    expect(SolanaAddress.safeParse("0OIl").success).toBe(false); // base58-excluded chars
    expect(SolanaAddress.safeParse("").success).toBe(false);
  });

  it("rejects a base58 string that decodes to the wrong byte length", () => {
    // 44 chars of base58 that is not 32 bytes on decode.
    expect(SolanaAddress.safeParse("1".repeat(44)).success).toBe(false);
  });
});
