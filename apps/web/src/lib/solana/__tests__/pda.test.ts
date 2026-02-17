import { describe, it, expect } from "vitest";
import { PublicKey } from "@solana/web3.js";
import {
  findConfigPDA,
  findCoursePDA,
  findEnrollmentPDA,
  findMinterRolePDA,
  findAchievementTypePDA,
  findAchievementReceiptPDA,
  PROGRAM_ID,
} from "../pda";

describe("PDA helpers", () => {
  it("exports the correct program ID", () => {
    expect(PROGRAM_ID.toBase58()).toBe(
      "3YchgRgR65gdRqgTZTM5qQXqtTZn5Kt2i6FPnZVu34Qb"
    );
  });

  it("findConfigPDA is deterministic", () => {
    const [pda1, bump1] = findConfigPDA(PROGRAM_ID);
    const [pda2, bump2] = findConfigPDA(PROGRAM_ID);
    expect(pda1.toBase58()).toBe(pda2.toBase58());
    expect(bump1).toBe(bump2);
  });

  it("findCoursePDA is unique per courseId", () => {
    const [pda1] = findCoursePDA("solana-101", PROGRAM_ID);
    const [pda2] = findCoursePDA("solana-102", PROGRAM_ID);
    expect(pda1.toBase58()).not.toBe(pda2.toBase58());
  });

  it("findEnrollmentPDA includes both courseId and user", () => {
    const user1 = PublicKey.unique();
    const user2 = PublicKey.unique();
    const [pda1] = findEnrollmentPDA("solana-101", user1, PROGRAM_ID);
    const [pda2] = findEnrollmentPDA("solana-101", user2, PROGRAM_ID);
    const [pda3] = findEnrollmentPDA("solana-102", user1, PROGRAM_ID);
    expect(pda1.toBase58()).not.toBe(pda2.toBase58());
    expect(pda1.toBase58()).not.toBe(pda3.toBase58());
  });

  it("findMinterRolePDA is deterministic", () => {
    const minter = PublicKey.unique();
    const [pda1] = findMinterRolePDA(minter, PROGRAM_ID);
    const [pda2] = findMinterRolePDA(minter, PROGRAM_ID);
    expect(pda1.toBase58()).toBe(pda2.toBase58());
  });

  it("findAchievementTypePDA is unique per achievementId", () => {
    const [pda1] = findAchievementTypePDA("first-steps", PROGRAM_ID);
    const [pda2] = findAchievementTypePDA("week-warrior", PROGRAM_ID);
    expect(pda1.toBase58()).not.toBe(pda2.toBase58());
  });

  it("findAchievementReceiptPDA is unique per recipient", () => {
    const user1 = PublicKey.unique();
    const user2 = PublicKey.unique();
    const [pda1] = findAchievementReceiptPDA("first-steps", user1, PROGRAM_ID);
    const [pda2] = findAchievementReceiptPDA("first-steps", user2, PROGRAM_ID);
    expect(pda1.toBase58()).not.toBe(pda2.toBase58());
  });

  it("PDA seeds match on-chain derivation", () => {
    const [expected] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      PROGRAM_ID
    );
    const [actual] = findConfigPDA(PROGRAM_ID);
    expect(actual.toBase58()).toBe(expected.toBase58());
  });

  it("throws on oversized courseId", () => {
    const longId = "a".repeat(33);
    expect(() => findCoursePDA(longId, PROGRAM_ID)).toThrow("courseId");
  });

  it("throws on empty courseId", () => {
    expect(() => findCoursePDA("", PROGRAM_ID)).toThrow("courseId");
  });

  it("throws on oversized achievementId", () => {
    const longId = "a".repeat(33);
    expect(() => findAchievementTypePDA(longId, PROGRAM_ID)).toThrow(
      "achievementId"
    );
  });
});
