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

const ALICE = new PublicKey("11111111111111111111111111111112");
const BOB = new PublicKey("11111111111111111111111111111113");

describe("getConfigPda", () => {
  it("returns a PublicKey and bump", () => {
    const [pda, bump] = getConfigPda();
    expect(pda).toBeInstanceOf(PublicKey);
    expect(typeof bump).toBe("number");
  });

  it("is deterministic", () => {
    const [pda1] = getConfigPda();
    const [pda2] = getConfigPda();
    expect(pda1.toBase58()).toBe(pda2.toBase58());
  });
});

describe("getCoursePda", () => {
  it("returns a PublicKey for a given courseId", () => {
    const [pda, bump] = getCoursePda("course-001");
    expect(pda).toBeInstanceOf(PublicKey);
    expect(typeof bump).toBe("number");
  });

  it("is deterministic", () => {
    const [pda1] = getCoursePda("course-abc");
    const [pda2] = getCoursePda("course-abc");
    expect(pda1.toBase58()).toBe(pda2.toBase58());
  });

  it("produces different PDAs for different course IDs", () => {
    const [pda1] = getCoursePda("course-001");
    const [pda2] = getCoursePda("course-002");
    expect(pda1.toBase58()).not.toBe(pda2.toBase58());
  });
});

describe("getEnrollmentPda", () => {
  it("returns a PublicKey for courseId + learner", () => {
    const [pda, bump] = getEnrollmentPda("course-001", ALICE);
    expect(pda).toBeInstanceOf(PublicKey);
    expect(typeof bump).toBe("number");
  });

  it("is deterministic", () => {
    const [pda1] = getEnrollmentPda("course-001", ALICE);
    const [pda2] = getEnrollmentPda("course-001", ALICE);
    expect(pda1.toBase58()).toBe(pda2.toBase58());
  });

  it("produces different PDAs for different learners", () => {
    const [pda1] = getEnrollmentPda("course-001", ALICE);
    const [pda2] = getEnrollmentPda("course-001", BOB);
    expect(pda1.toBase58()).not.toBe(pda2.toBase58());
  });

  it("produces different PDAs for different courses", () => {
    const [pda1] = getEnrollmentPda("course-001", ALICE);
    const [pda2] = getEnrollmentPda("course-002", ALICE);
    expect(pda1.toBase58()).not.toBe(pda2.toBase58());
  });
});

describe("getMinterRolePda", () => {
  it("returns a PublicKey for a given minter", () => {
    const [pda, bump] = getMinterRolePda(ALICE);
    expect(pda).toBeInstanceOf(PublicKey);
    expect(typeof bump).toBe("number");
  });

  it("is deterministic", () => {
    const [pda1] = getMinterRolePda(ALICE);
    const [pda2] = getMinterRolePda(ALICE);
    expect(pda1.toBase58()).toBe(pda2.toBase58());
  });

  it("produces different PDAs for different minters", () => {
    const [pda1] = getMinterRolePda(ALICE);
    const [pda2] = getMinterRolePda(BOB);
    expect(pda1.toBase58()).not.toBe(pda2.toBase58());
  });
});

describe("getAchievementTypePda", () => {
  it("returns a PublicKey for a given achievementId", () => {
    const [pda, bump] = getAchievementTypePda("first-lesson");
    expect(pda).toBeInstanceOf(PublicKey);
    expect(typeof bump).toBe("number");
  });

  it("is deterministic", () => {
    const [pda1] = getAchievementTypePda("first-lesson");
    const [pda2] = getAchievementTypePda("first-lesson");
    expect(pda1.toBase58()).toBe(pda2.toBase58());
  });

  it("produces different PDAs for different achievement IDs", () => {
    const [pda1] = getAchievementTypePda("first-lesson");
    const [pda2] = getAchievementTypePda("course-complete");
    expect(pda1.toBase58()).not.toBe(pda2.toBase58());
  });
});

describe("getAchievementReceiptPda", () => {
  it("returns a PublicKey for achievementId + recipient", () => {
    const [pda, bump] = getAchievementReceiptPda("first-lesson", ALICE);
    expect(pda).toBeInstanceOf(PublicKey);
    expect(typeof bump).toBe("number");
  });

  it("is deterministic", () => {
    const [pda1] = getAchievementReceiptPda("first-lesson", ALICE);
    const [pda2] = getAchievementReceiptPda("first-lesson", ALICE);
    expect(pda1.toBase58()).toBe(pda2.toBase58());
  });

  it("produces different PDAs for different recipients", () => {
    const [pda1] = getAchievementReceiptPda("first-lesson", ALICE);
    const [pda2] = getAchievementReceiptPda("first-lesson", BOB);
    expect(pda1.toBase58()).not.toBe(pda2.toBase58());
  });

  it("produces different PDAs for different achievement IDs", () => {
    const [pda1] = getAchievementReceiptPda("first-lesson", ALICE);
    const [pda2] = getAchievementReceiptPda("course-complete", ALICE);
    expect(pda1.toBase58()).not.toBe(pda2.toBase58());
  });
});
