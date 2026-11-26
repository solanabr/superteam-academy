import { describe, it, expect } from "vitest";
import type { AdminCourse } from "@/lib/content/queries";
import {
  blockingImmutableDiffs,
  diffCourse,
  getMissingCourseFields,
  isLegacyTrackDiff,
  isLegacyTrackOnly,
  pendingDifferences,
  type OnChainCourse,
} from "../sync-diff";

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

describe("legacy track fields (on-chain 0, created before tracks)", () => {
  const DEVNET = { allowLegacyTrack: true } as const;

  it("track-only diff with on-chain 0/0 reads synced and does not block", () => {
    const diff = diffCourse(
      course({ trackId: 2, trackLevel: 1 }),
      onChain(),
      null,
      DEVNET
    );
    expect(diff.status).toBe("synced");
    expect(diff.legacyTrackOnly).toBe(true);
    expect(diff.hasImmutableMismatch).toBe(true);
    expect(diff.differences.map((d) => d.field)).toEqual([
      "trackId",
      "trackLevel",
    ]);
    expect(blockingImmutableDiffs(diff.differences, true)).toEqual([]);
    expect(pendingDifferences(diff.differences, true)).toEqual([]);
  });

  it("fails closed by default (mainnet or unidentified cluster): track-only 0/0 still blocks", () => {
    const diff = diffCourse(course({ trackId: 2, trackLevel: 1 }), onChain());
    expect(diff.status).toBe("out_of_sync");
    expect(diff.legacyTrackOnly).toBe(false);
    expect(
      blockingImmutableDiffs(diff.differences, diff.legacyTrackOnly).map(
        (d) => d.field
      )
    ).toEqual(["trackId", "trackLevel"]);
  });

  it("only one track field differing from 0 is still legacy", () => {
    const diff = diffCourse(course({ trackId: 3 }), onChain(), null, DEVNET);
    expect(diff.status).toBe("synced");
    expect(diff.legacyTrackOnly).toBe(true);
  });

  it("legacy track plus updateable diffs is out_of_sync and syncable", () => {
    const diff = diffCourse(
      course({ trackId: 2, trackLevel: 1, xpPerLesson: 75, lessonCount: 5 }),
      onChain(),
      null,
      DEVNET
    );
    expect(diff.status).toBe("out_of_sync");
    expect(diff.legacyTrackOnly).toBe(true);
    expect(blockingImmutableDiffs(diff.differences, true)).toEqual([]);
    expect(
      pendingDifferences(diff.differences, true).map((d) => d.field)
    ).toEqual(["xpPerLesson", "lessonCount"]);
  });

  it("a track mismatch with a non-zero on-chain value still blocks", () => {
    const diff = diffCourse(
      course({ trackId: 2, trackLevel: 1 }),
      onChain({ trackId: 1, trackLevel: 1 }),
      null,
      DEVNET
    );
    expect(diff.status).toBe("out_of_sync");
    expect(diff.legacyTrackOnly).toBe(false);
    expect(
      blockingImmutableDiffs(diff.differences, false).map((d) => d.field)
    ).toEqual(["trackId"]);
  });

  it("on-chain trackId 0 with a non-zero on-chain trackLevel mismatch still blocks", () => {
    const diff = diffCourse(
      course({ trackId: 2, trackLevel: 3 }),
      onChain({ trackId: 0, trackLevel: 1 }),
      null,
      DEVNET
    );
    expect(diff.status).toBe("out_of_sync");
    expect(diff.legacyTrackOnly).toBe(false);
  });

  it.each([
    ["negative", -1],
    ["fractional", 1.5],
    ["NaN", Number.NaN],
  ])(
    "a %s content track value vs on-chain 0 is not legacy",
    (_label, value) => {
      const diff = diffCourse(
        course({ trackId: value }),
        onChain(),
        null,
        DEVNET
      );
      expect(diff.legacyTrackOnly).toBe(false);
      expect(diff.status).toBe("out_of_sync");
    }
  );

  it("isLegacyTrackDiff requires on-chain 0 and an integer content value >= 1", () => {
    const entry = (contentValue: unknown, onChainValue: unknown) => ({
      field: "trackLevel",
      contentValue,
      onChainValue,
      updateable: false,
    });
    expect(isLegacyTrackDiff(entry(1, 0))).toBe(true);
    expect(isLegacyTrackDiff(entry(0, 0))).toBe(false);
    expect(isLegacyTrackDiff(entry(-1, 0))).toBe(false);
    expect(isLegacyTrackDiff(entry(Number.NaN, 0))).toBe(false);
    expect(isLegacyTrackDiff(entry("2", 0))).toBe(false);
    expect(isLegacyTrackDiff(entry(2, 1))).toBe(false);
    expect(isLegacyTrackDiff({ ...entry(2, 0), field: "difficulty" })).toBe(
      false
    );
  });

  it.each([
    ["creator", { creator: WRONG_WALLET }],
    ["difficulty", { difficulty: 3 }],
    ["lessonCount decrease", { lessonCount: 5 }],
    ["prerequisite", { prerequisite: "Prereq" + "1".repeat(30) }],
  ] as const)(
    "legacy track plus a %s diff still blocks, track fields included",
    (_label, chainOverrides) => {
      const diff = diffCourse(
        course({ trackId: 2, trackLevel: 1 }),
        onChain(chainOverrides),
        null,
        DEVNET
      );
      expect(diff.status).toBe("out_of_sync");
      expect(diff.legacyTrackOnly).toBe(false);
      const blocking = blockingImmutableDiffs(
        diff.differences,
        diff.legacyTrackOnly
      ).map((d) => d.field);
      expect(blocking).toHaveLength(3);
      expect(blocking).toEqual(
        expect.arrayContaining(["trackId", "trackLevel"])
      );
      expect(pendingDifferences(diff.differences, false)).toEqual(
        diff.differences
      );
    }
  );

  it("isLegacyTrackOnly is false with no immutable diffs", () => {
    expect(isLegacyTrackOnly([])).toBe(false);
    expect(
      isLegacyTrackOnly([
        {
          field: "xpPerLesson",
          contentValue: 1,
          onChainValue: 2,
          updateable: true,
        },
      ])
    ).toBe(false);
  });
});
