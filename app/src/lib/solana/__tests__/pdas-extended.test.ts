// @vitest-environment node
import { describe, it, expect } from "vitest";
import { PublicKey } from "@solana/web3.js";
import {
  getConfigPda,
  getCoursePda,
  getEnrollmentPda,
  getMinterRolePda,
  getAchievementTypePda,
  getAchievementReceiptPda,
} from "../pdas";

// Additional fixed test wallets (valid base58-encoded public keys)
const WALLET_A = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const WALLET_B = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJe8bv");
const WALLET_C = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

describe("getConfigPda — extended", () => {
  it("bump is a valid canonical bump (0–255)", () => {
    const [, bump] = getConfigPda();
    expect(bump).toBeGreaterThanOrEqual(0);
    expect(bump).toBeLessThanOrEqual(255);
  });

  it("PDA does not equal the system program", () => {
    const [pda] = getConfigPda();
    expect(pda.toBase58()).not.toBe("11111111111111111111111111111111");
  });

  it("calling multiple times in the same process returns same result", () => {
    const results = Array.from({ length: 5 }, () => getConfigPda());
    const first = results[0][0].toBase58();
    for (const [pda] of results) {
      expect(pda.toBase58()).toBe(first);
    }
  });
});

describe("getCoursePda — extended", () => {
  it("different course IDs always produce distinct PDAs", () => {
    const courseIds = ["course-1", "course-2", "course-3", "solana-101", "defi-basics"];
    const pdas = courseIds.map(id => getCoursePda(id)[0].toBase58());
    const unique = new Set(pdas);
    expect(unique.size).toBe(courseIds.length);
  });

  it("produces a valid base58-encoded string of correct length", () => {
    const [pda] = getCoursePda("some-course");
    const base58 = pda.toBase58();
    // Solana public keys are 32 bytes → 43–44 chars in base58
    expect(base58.length).toBeGreaterThanOrEqual(32);
    expect(base58.length).toBeLessThanOrEqual(44);
  });

  it("handles empty courseId", () => {
    // Should produce a deterministic PDA, not throw
    expect(() => getCoursePda("")).not.toThrow();
    const [pda1] = getCoursePda("");
    const [pda2] = getCoursePda("");
    expect(pda1.toBase58()).toBe(pda2.toBase58());
  });

  it("handles unicode characters in courseId", () => {
    expect(() => getCoursePda("curso-básico")).not.toThrow();
    const [pda1] = getCoursePda("curso-básico");
    const [pda2] = getCoursePda("curso-básico");
    expect(pda1.toBase58()).toBe(pda2.toBase58());
  });

  it("course PDA differs from config PDA", () => {
    const [configPda] = getConfigPda();
    const [coursePda] = getCoursePda("any-course");
    expect(configPda.toBase58()).not.toBe(coursePda.toBase58());
  });
});

describe("getEnrollmentPda — extended", () => {
  it("all four combinations of two courses x two learners produce distinct PDAs", () => {
    const pda1 = getEnrollmentPda("course-1", WALLET_A)[0].toBase58();
    const pda2 = getEnrollmentPda("course-1", WALLET_B)[0].toBase58();
    const pda3 = getEnrollmentPda("course-2", WALLET_A)[0].toBase58();
    const pda4 = getEnrollmentPda("course-2", WALLET_B)[0].toBase58();
    const unique = new Set([pda1, pda2, pda3, pda4]);
    expect(unique.size).toBe(4);
  });

  it("enrollment PDA does not equal the course PDA for the same courseId", () => {
    const [coursePda] = getCoursePda("course-1");
    const [enrollmentPda] = getEnrollmentPda("course-1", WALLET_A);
    expect(coursePda.toBase58()).not.toBe(enrollmentPda.toBase58());
  });

  it("is deterministic across three wallets independently", () => {
    for (const wallet of [WALLET_A, WALLET_B, WALLET_C]) {
      const [p1] = getEnrollmentPda("test-course", wallet);
      const [p2] = getEnrollmentPda("test-course", wallet);
      expect(p1.toBase58()).toBe(p2.toBase58());
    }
  });
});

describe("getMinterRolePda — extended", () => {
  it("all three wallets produce distinct PDAs", () => {
    const pdas = [WALLET_A, WALLET_B, WALLET_C].map(w => getMinterRolePda(w)[0].toBase58());
    const unique = new Set(pdas);
    expect(unique.size).toBe(3);
  });

  it("minterRole PDA differs from enrollment PDA for same wallet", () => {
    const [minterPda] = getMinterRolePda(WALLET_A);
    const [enrollmentPda] = getEnrollmentPda("any-course", WALLET_A);
    expect(minterPda.toBase58()).not.toBe(enrollmentPda.toBase58());
  });

  it("bump is in valid range", () => {
    const [, bump] = getMinterRolePda(WALLET_A);
    expect(bump).toBeGreaterThanOrEqual(0);
    expect(bump).toBeLessThanOrEqual(255);
  });
});

describe("getAchievementTypePda — extended", () => {
  it("many different achievement IDs produce distinct PDAs", () => {
    const ids = ["first-lesson", "course-complete", "streak-7", "streak-30", "streak-100"];
    const pdas = ids.map(id => getAchievementTypePda(id)[0].toBase58());
    const unique = new Set(pdas);
    expect(unique.size).toBe(ids.length);
  });

  it("achievement type PDA differs from course PDA with same ID string", () => {
    const [achPda] = getAchievementTypePda("my-course");
    const [coursePda] = getCoursePda("my-course");
    expect(achPda.toBase58()).not.toBe(coursePda.toBase58());
  });

  it("handles hyphenated achievement IDs deterministically", () => {
    const [p1] = getAchievementTypePda("first-lesson-completed");
    const [p2] = getAchievementTypePda("first-lesson-completed");
    expect(p1.toBase58()).toBe(p2.toBase58());
  });
});

describe("getAchievementReceiptPda — extended", () => {
  it("two wallets for the same achievement produce different receipt PDAs", () => {
    const [pdaA] = getAchievementReceiptPda("streak-7", WALLET_A);
    const [pdaB] = getAchievementReceiptPda("streak-7", WALLET_B);
    expect(pdaA.toBase58()).not.toBe(pdaB.toBase58());
  });

  it("receipt PDA differs from achievement type PDA for same achievement ID", () => {
    const [typePda] = getAchievementTypePda("first-lesson");
    const [receiptPda] = getAchievementReceiptPda("first-lesson", WALLET_A);
    expect(typePda.toBase58()).not.toBe(receiptPda.toBase58());
  });

  it("all six combinations of two achievements x three wallets are distinct", () => {
    const achievements = ["ach-1", "ach-2"];
    const wallets = [WALLET_A, WALLET_B, WALLET_C];
    const pdas = new Set<string>();
    for (const ach of achievements) {
      for (const wallet of wallets) {
        pdas.add(getAchievementReceiptPda(ach, wallet)[0].toBase58());
      }
    }
    expect(pdas.size).toBe(6);
  });
});

describe("cross-PDA uniqueness", () => {
  it("config, course, enrollment, minterRole, achievementType, achievementReceipt all produce distinct PDAs", () => {
    const [config] = getConfigPda();
    const [course] = getCoursePda("course-1");
    const [enrollment] = getEnrollmentPda("course-1", WALLET_A);
    const [minterRole] = getMinterRolePda(WALLET_A);
    const [achievementType] = getAchievementTypePda("first-lesson");
    const [achievementReceipt] = getAchievementReceiptPda("first-lesson", WALLET_A);

    const all = [config, course, enrollment, minterRole, achievementType, achievementReceipt].map(p => p.toBase58());
    const unique = new Set(all);
    expect(unique.size).toBe(6);
  });
});
