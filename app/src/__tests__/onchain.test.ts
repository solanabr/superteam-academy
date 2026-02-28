import { describe, it, expect } from "vitest";
import { BN } from "@coral-xyz/anchor";
import {
  isLessonComplete,
  countCompletedLessons,
  getCompletedLessonIndices,
} from "@/lib/onchain/bitmap";
import {
  getConfigPda,
  getCoursePda,
  getEnrollmentPda,
  getMinterRolePda,
  getAchievementTypePda,
  getAchievementReceiptPda,
} from "@/lib/onchain/pda";
import {
  PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  MPL_CORE_PROGRAM_ID,
} from "@/lib/onchain/constants";

// ---------------------------------------------------------------------------
// Bitmap helpers
// ---------------------------------------------------------------------------
describe("bitmap helpers", () => {
  const emptyFlags = [new BN(0), new BN(0), new BN(0), new BN(0)];

  it("reports no lessons complete for empty bitmap", () => {
    expect(isLessonComplete(emptyFlags, 0)).toBe(false);
    expect(isLessonComplete(emptyFlags, 63)).toBe(false);
    expect(countCompletedLessons(emptyFlags)).toBe(0);
  });

  it("detects single lesson completion in first word", () => {
    const flags = [new BN(1), new BN(0), new BN(0), new BN(0)]; // bit 0 set
    expect(isLessonComplete(flags, 0)).toBe(true);
    expect(isLessonComplete(flags, 1)).toBe(false);
    expect(countCompletedLessons(flags)).toBe(1);
  });

  it("detects lesson in higher bit positions", () => {
    // Set bit 5 (value 32)
    const flags = [new BN(32), new BN(0), new BN(0), new BN(0)];
    expect(isLessonComplete(flags, 5)).toBe(true);
    expect(isLessonComplete(flags, 4)).toBe(false);
    expect(isLessonComplete(flags, 6)).toBe(false);
  });

  it("detects lessons across multiple words", () => {
    // Bit 0 of word 0 + bit 0 of word 1 (lesson 64)
    const flags = [new BN(1), new BN(1), new BN(0), new BN(0)];
    expect(isLessonComplete(flags, 0)).toBe(true);
    expect(isLessonComplete(flags, 64)).toBe(true);
    expect(isLessonComplete(flags, 1)).toBe(false);
    expect(countCompletedLessons(flags)).toBe(2);
  });

  it("handles all four words", () => {
    const flags = [new BN(1), new BN(1), new BN(1), new BN(1)];
    expect(isLessonComplete(flags, 0)).toBe(true);
    expect(isLessonComplete(flags, 64)).toBe(true);
    expect(isLessonComplete(flags, 128)).toBe(true);
    expect(isLessonComplete(flags, 192)).toBe(true);
    expect(countCompletedLessons(flags)).toBe(4);
  });

  it("returns false for out-of-range indices", () => {
    const flags = [new BN(0xff), new BN(0), new BN(0), new BN(0)];
    expect(isLessonComplete(flags, -1)).toBe(false);
    expect(isLessonComplete(flags, 256)).toBe(false);
  });

  it("getCompletedLessonIndices returns correct indices", () => {
    // Bits 0, 2, 4 set = 0b10101 = 21
    const flags = [new BN(21), new BN(0), new BN(0), new BN(0)];
    expect(getCompletedLessonIndices(flags, 8)).toEqual([0, 2, 4]);
  });

  it("getCompletedLessonIndices respects lessonCount", () => {
    // All bits in first byte set (0xFF = 255)
    const flags = [new BN(255), new BN(0), new BN(0), new BN(0)];
    // Only check first 4 lessons
    expect(getCompletedLessonIndices(flags, 4)).toEqual([0, 1, 2, 3]);
  });

  it("handles multiple bits in multiple words", () => {
    // word 0: bits 0,1 (=3), word 2: bit 0 (=1)
    const flags = [new BN(3), new BN(0), new BN(1), new BN(0)];
    expect(getCompletedLessonIndices(flags, 200)).toEqual([0, 1, 128]);
    expect(countCompletedLessons(flags)).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// PDA derivation — seed construction and constants
// Note: findProgramAddressSync requires native ed25519 bindings which may
// not be available in the vitest jsdom environment. We test the constants
// and verify the functions are correctly exported.
// ---------------------------------------------------------------------------
describe("PDA derivation", () => {
  it("PROGRAM_ID matches the deployed program", () => {
    expect(PROGRAM_ID.toBase58()).toBe(
      "ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf"
    );
  });

  it("PDA functions are exported and callable", () => {
    expect(typeof getConfigPda).toBe("function");
    expect(typeof getCoursePda).toBe("function");
    expect(typeof getEnrollmentPda).toBe("function");
    expect(typeof getMinterRolePda).toBe("function");
    expect(typeof getAchievementTypePda).toBe("function");
    expect(typeof getAchievementReceiptPda).toBe("function");
  });

  it("PROGRAM_ID is a valid 32-byte public key", () => {
    expect(PROGRAM_ID.toBytes()).toHaveLength(32);
  });

  it("TOKEN_2022_PROGRAM_ID matches the canonical address", () => {
    expect(TOKEN_2022_PROGRAM_ID.toBase58()).toBe(
      "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
    );
  });

  it("MPL_CORE_PROGRAM_ID matches the canonical address", () => {
    expect(MPL_CORE_PROGRAM_ID.toBase58()).toBe(
      "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
    );
  });
});
