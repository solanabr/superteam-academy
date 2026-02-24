import { describe, it, expect } from "vitest";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  getConfigPda,
  getCoursePda,
  getEnrollmentPda,
  getMinterPda,
  getAchievementTypePda,
  getAchievementReceiptPda,
} from "./pda";

// System Program = valid 32-byte key; second from deterministic seed
const WALLET_A = new PublicKey("11111111111111111111111111111111");
const WALLET_B = Keypair.generate().publicKey;

describe("PDA derivation", () => {
  it("configPda is deterministic", () => {
    expect(getConfigPda().equals(getConfigPda())).toBe(true);
  });

  it("coursePda is deterministic for same courseId", () => {
    expect(getCoursePda("solana-101").equals(getCoursePda("solana-101"))).toBe(
      true
    );
  });

  it("coursePda differs per courseId", () => {
    expect(
      getCoursePda("solana-101").equals(getCoursePda("anchor-101"))
    ).toBe(false);
  });

  it("enrollmentPda is deterministic for same inputs", () => {
    expect(
      getEnrollmentPda("solana-101", WALLET_A).equals(
        getEnrollmentPda("solana-101", WALLET_A)
      )
    ).toBe(true);
  });

  it("enrollmentPda differs per learner", () => {
    expect(
      getEnrollmentPda("solana-101", WALLET_A).equals(
        getEnrollmentPda("solana-101", WALLET_B)
      )
    ).toBe(false);
  });

  it("minterPda returns a PublicKey", () => {
    expect(getMinterPda(WALLET_A)).toBeInstanceOf(PublicKey);
  });

  it("achievementTypePda differs per id", () => {
    expect(
      getAchievementTypePda("badge-a").equals(getAchievementTypePda("badge-b"))
    ).toBe(false);
  });

  it("achievementReceiptPda differs per recipient", () => {
    expect(
      getAchievementReceiptPda("badge-a", WALLET_A).equals(
        getAchievementReceiptPda("badge-a", WALLET_B)
      )
    ).toBe(false);
  });
});
