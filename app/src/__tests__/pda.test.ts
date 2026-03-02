import { describe, it, expect } from "vitest";
import { PublicKey } from "@solana/web3.js";
import {
  getConfigPda,
  getCoursePda,
  getEnrollmentPda,
  getMinterRolePda,
  getAchievementTypePda,
  getAchievementReceiptPda,
} from "@/lib/solana/pda";

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
    const learner = PublicKey.default;
    const [pda1] = getEnrollmentPda("solana-101", learner);
    const [pda2] = getEnrollmentPda("solana-101", learner);
    expect(pda1.equals(pda2)).toBe(true);
  });

  it("different learners get different enrollment PDAs", () => {
    const learner1 = new PublicKey("11111111111111111111111111111111");
    const learner2 = new PublicKey("22222222222222222222222222222222");
    const [pda1] = getEnrollmentPda("solana-101", learner1);
    const [pda2] = getEnrollmentPda("solana-101", learner2);
    expect(pda1.equals(pda2)).toBe(false);
  });

  it("derives minter role PDA", () => {
    const minter = PublicKey.default;
    const [pda] = getMinterRolePda(minter);
    expect(pda).toBeInstanceOf(PublicKey);
  });

  it("derives achievement type PDA", () => {
    const [pda] = getAchievementTypePda("hackathon-winner");
    expect(pda).toBeInstanceOf(PublicKey);
  });

  it("derives achievement receipt PDA", () => {
    const recipient = PublicKey.default;
    const [pda] = getAchievementReceiptPda("hackathon-winner", recipient);
    expect(pda).toBeInstanceOf(PublicKey);
  });

  it("returns bump as second element", () => {
    const result = getConfigPda();
    expect(result).toHaveLength(2);
    expect(typeof result[1]).toBe("number");
    expect(result[1]).toBeGreaterThanOrEqual(0);
    expect(result[1]).toBeLessThanOrEqual(255);
  });
});
