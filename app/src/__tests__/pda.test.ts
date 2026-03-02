import { describe, it, expect } from "vitest";
import { PublicKey, Keypair } from "@solana/web3.js";
import {
  getConfigPda,
  getCoursePda,
  getEnrollmentPda,
  getMinterRolePda,
  getAchievementTypePda,
  getAchievementReceiptPda,
} from "@/lib/solana/pda";

// Use a real keypair for test wallet to avoid nonce-not-found edge cases
const testWallet = Keypair.generate().publicKey;

describe("PDA derivation", () => {
  it("derives config PDA deterministically", () => {
    const [pda1] = getConfigPda();
    const [pda2] = getConfigPda();
    expect(pda1.equals(pda2)).toBe(true);
    expect(pda1).toBeInstanceOf(PublicKey);
  });

  it("derives course PDA with courseId seed", () => {
    const [pda1] = getCoursePda("solana-101");
    const [pda2] = getCoursePda("solana-101");
    const [pda3] = getCoursePda("anchor-101");
    expect(pda1.equals(pda2)).toBe(true);
    expect(pda1.equals(pda3)).toBe(false);
  });

  it("derives enrollment PDA with courseId and learner", () => {
    const [pda1] = getEnrollmentPda("solana-101", testWallet);
    const [pda2] = getEnrollmentPda("solana-101", testWallet);
    expect(pda1.equals(pda2)).toBe(true);
  });

  it("different learners get different enrollment PDAs", () => {
    const learner1 = Keypair.generate().publicKey;
    const learner2 = Keypair.generate().publicKey;
    const [pda1] = getEnrollmentPda("solana-101", learner1);
    const [pda2] = getEnrollmentPda("solana-101", learner2);
    expect(pda1.equals(pda2)).toBe(false);
  });

  it("derives minter role PDA", () => {
    const [pda, bump] = getMinterRolePda(testWallet);
    expect(pda).toBeInstanceOf(PublicKey);
    expect(typeof bump).toBe("number");
  });

  it("derives achievement type PDA", () => {
    const [pda, bump] = getAchievementTypePda("hackathon-winner");
    expect(pda).toBeInstanceOf(PublicKey);
    expect(bump).toBeGreaterThanOrEqual(0);
    expect(bump).toBeLessThanOrEqual(255);
  });

  it("derives achievement receipt PDA", () => {
    const [pda, bump] = getAchievementReceiptPda(
      "hackathon-winner",
      testWallet,
    );
    expect(pda).toBeInstanceOf(PublicKey);
    expect(bump).toBeGreaterThanOrEqual(0);
  });

  it("config PDA returns bump in valid range", () => {
    const [, bump] = getConfigPda();
    expect(bump).toBeGreaterThanOrEqual(0);
    expect(bump).toBeLessThanOrEqual(255);
  });
});
