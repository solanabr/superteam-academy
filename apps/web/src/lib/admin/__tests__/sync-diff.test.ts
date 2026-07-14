import { describe, it, expect } from "vitest";
import {
  diffCourse,
  getMissingCourseFields,
  type OnChainCourse,
} from "../sync-diff";
import type { AdminCourse } from "@/lib/content/queries";

// Valid base58 shapes (charset [1-9A-HJ-NP-Za-km-z], 32-44 chars).
const INSTRUCTOR_WALLET = "CreatorWa11et" + "1".repeat(31);
const WRONG_WALLET = "WrongWa11et" + "1".repeat(33);

function course(overrides: Partial<AdminCourse> = {}): AdminCourse {
  return {
    _id: "course-rust",
    title: "Rust",
    slug: "rust",
    difficulty: "beginner",
    creatorWallet: INSTRUCTOR_WALLET,
    xpPerLesson: 50,
    trackId: 0,
    trackLevel: 0,
    prerequisiteCourse: null,
    creatorRewardXp: 0,
    minCompletionsForReward: 0,
    lessonCount: 3,
    trackCollectionAddress: null,
    onChainStatus: null,
    ...overrides,
  };
}

function onChain(overrides: Partial<OnChainCourse> = {}): OnChainCourse {
  return {
    courseId: "course-rust",
    creator: INSTRUCTOR_WALLET,
    lessonCount: 3,
    difficulty: 1,
    xpPerLesson: 50,
    trackId: 0,
    trackLevel: 0,
    prerequisite: null,
    creatorRewardXp: 0,
    totalCompletions: 0,
    totalEnrollments: 0,
    isActive: true,
    version: 1,
    ...overrides,
  };
}

describe("#400 — creator mismatch detection", () => {
  it("a matching creator produces no diff", () => {
    const diff = diffCourse(course(), onChain());
    expect(diff.status).toBe("synced");
    expect(diff.differences).toEqual([]);
    expect(diff.hasImmutableMismatch).toBe(false);
  });

  it("on-chain creator ≠ instructor wallet → immutable creator diff", () => {
    const diff = diffCourse(course(), onChain({ creator: WRONG_WALLET }));
    expect(diff.status).toBe("out_of_sync");
    expect(diff.hasImmutableMismatch).toBe(true);
    expect(diff.differences).toEqual([
      {
        field: "creator",
        contentValue: INSTRUCTOR_WALLET,
        onChainValue: WRONG_WALLET,
        updateable: false,
      },
    ]);
  });

  it("missing creatorWallet → missing_fields", () => {
    const c = course({ creatorWallet: null });
    expect(getMissingCourseFields(c)).toContain("creatorWallet");
    const diff = diffCourse(c, onChain());
    expect(diff.status).toBe("missing_fields");
    expect(diff.missingFields).toContain("creatorWallet");
    expect(diff.differences).toEqual([]);
  });

  it("a value not shaped like a pubkey → missing_fields", () => {
    // Contains 0/O/I/l (excluded from base58) and is too short.
    for (const bad of ["not-a-wallet", "O0Il" + "1".repeat(40), "abc"]) {
      expect(getMissingCourseFields(course({ creatorWallet: bad }))).toContain(
        "creatorWallet"
      );
    }
  });

  it("a well-shaped wallet passes the missing-fields gate", () => {
    expect(getMissingCourseFields(course())).toEqual([]);
  });
});
