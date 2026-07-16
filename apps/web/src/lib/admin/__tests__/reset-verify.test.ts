import { describe, it, expect, vi } from "vitest";
import { PublicKey } from "@solana/web3.js";
import type { Idl } from "@coral-xyz/anchor";
import { BorshCoder } from "@coral-xyz/anchor";
import BN from "bn.js";
import IDL from "../../solana/idl/superteam_academy.json";
import VNEXT_IDL from "../../solana/idl/superteam_academy_vnext.json";
import { COURSE_SIZE_V1, COURSE_SIZE_VNEXT } from "../../solana/academy-reads";
import {
  snapshotOnChainState,
  verifyReset,
  type CourseSnapshot,
  type EnrollmentSnapshot,
  type ExpectedByCourseId,
  type ResetSnapshot,
} from "../reset-verify";

// -----------------------------------------------------------------------------
// Shared fixture helpers
// -----------------------------------------------------------------------------

const CREATOR = "Creator11111111111111111111111111111111111";
const OTHER_CREATOR = "Instructor111111111111111111111111111111111";
const COURSE_PDA = "CoursePda111111111111111111111111111111111";
const OTHER_COURSE_PDA = "OtherCoursePda11111111111111111111111111111";

/**
 * Reproduces the module's `maskToHex` format independently (64 hex chars,
 * word[3] first) from a plain list of set-bit indices (0-255) — this is the
 * documented contract of `activeLessonsOrCount` / `lessonFlags`, which any
 * real caller (B3, the CLI's expected.json) has to construct the same way.
 */
function bitsToHex(bits: number[]): string {
  const words: [bigint, bigint, bigint, bigint] = [0n, 0n, 0n, 0n];
  for (const bit of bits) {
    const wordIndex = Math.floor(bit / 64) as 0 | 1 | 2 | 3;
    words[wordIndex] |= 1n << BigInt(bit % 64);
  }
  return [words[3], words[2], words[1], words[0]]
    .map((w) => w.toString(16).padStart(16, "0"))
    .join("");
}

function course(overrides: Partial<CourseSnapshot> = {}): CourseSnapshot {
  return {
    courseId: "course-rust",
    coursePda: COURSE_PDA,
    sizeBytes: COURSE_SIZE_VNEXT,
    creator: CREATOR,
    creatorRewardXp: 30,
    liveLessonCount: 3,
    activeLessonsOrCount: bitsToHex([0, 1, 2]),
    contentTxId: "00".repeat(32),
    ...overrides,
  };
}

function enrollment(
  overrides: Partial<EnrollmentSnapshot> = {}
): EnrollmentSnapshot {
  return {
    address: "Enrollment1111111111111111111111111111111111",
    course: COURSE_PDA,
    lessonFlags: bitsToHex([0, 1]),
    ...overrides,
  };
}

function snapshot(overrides: Partial<ResetSnapshot> = {}): ResetSnapshot {
  return {
    courses: [],
    enrollments: [],
    undecodedCourses: [],
    undecodedEnrollments: [],
    ...overrides,
  };
}

const EXPECTED: ExpectedByCourseId = {
  "course-rust": {
    expectedSize: COURSE_SIZE_VNEXT,
    expectedCreator: CREATOR,
    expectedRewardXp: 30,
  },
};

// -----------------------------------------------------------------------------
// verifyReset — the invariant/second-observer backbone
// -----------------------------------------------------------------------------

describe("verifyReset — (a) clean recreate", () => {
  it("passes with no failures when every invariant holds", () => {
    const pre = snapshot({
      courses: [
        course({
          sizeBytes: COURSE_SIZE_V1,
          creatorRewardXp: 750,
          liveLessonCount: 3,
          activeLessonsOrCount: bitsToHex([0, 1, 2]),
        }),
      ],
      enrollments: [enrollment({ lessonFlags: bitsToHex([0, 1]) })],
    });
    const post = snapshot({
      courses: [course()], // 253 bytes, creatorRewardXp 30, popcount 3
      enrollments: [enrollment({ lessonFlags: bitsToHex([0, 1]) })],
    });

    const result = verifyReset(pre, post, EXPECTED);

    expect(result.ok).toBe(true);
    expect(result.failures).toEqual([]);
    expect(result.perCourse).toEqual([
      { courseId: "course-rust", ok: true, failures: [] },
    ]);
    expect(result.perEnrollment).toEqual([
      { address: enrollment().address, ok: true, failures: [] },
    ]);
  });
});

describe("verifyReset — (b) H3 popcount: widened lesson count", () => {
  it("flags a course whose post popcount exceeds the pre liveLessonCount", () => {
    const pre = snapshot({
      courses: [
        course({
          liveLessonCount: 3,
          activeLessonsOrCount: bitsToHex([0, 1, 2]),
        }),
      ],
    });
    const post = snapshot({
      // A 4th bit turned "live" that was never live pre-reset — popcount 4 > 3.
      courses: [
        course({
          liveLessonCount: 4,
          activeLessonsOrCount: bitsToHex([0, 1, 2, 3]),
        }),
      ],
    });

    const result = verifyReset(pre, post, EXPECTED);

    expect(result.ok).toBe(false);
    const courseResult = result.perCourse[0];
    expect(courseResult?.ok).toBe(false);
    expect(courseResult?.failures.some((f) => f.includes("[H3]"))).toBe(true);
    expect(courseResult?.failures.some((f) => f.includes("widened"))).toBe(
      true
    );
  });

  it("flags a course whose post popcount is narrower than the pre liveLessonCount", () => {
    const pre = snapshot({
      courses: [
        course({
          liveLessonCount: 3,
          activeLessonsOrCount: bitsToHex([0, 1, 2]),
        }),
      ],
    });
    const post = snapshot({
      courses: [
        course({ liveLessonCount: 2, activeLessonsOrCount: bitsToHex([0, 1]) }),
      ],
    });

    const result = verifyReset(pre, post, EXPECTED);

    expect(result.ok).toBe(false);
    expect(
      result.perCourse[0]?.failures.some((f) => f.includes("narrowed"))
    ).toBe(true);
  });
});

describe("verifyReset — (c) H3 superset: post mask drops a learner's completed bit", () => {
  it("flags the course when the post mask no longer covers a pre enrollment's lesson_flags, even with matching popcount", () => {
    const pre = snapshot({
      courses: [
        course({
          liveLessonCount: 3,
          activeLessonsOrCount: bitsToHex([0, 1, 2]),
        }),
      ],
      enrollments: [
        // Learner completed lesson 2 (bit 2) before the reset.
        enrollment({ lessonFlags: bitsToHex([0, 1, 2]) }),
      ],
    });
    const post = snapshot({
      // Same popcount (3) as pre — H3a (popcount) alone would NOT catch this —
      // but bit 2 was swapped for bit 4, so the mask no longer covers the
      // learner's completed bit 2. Only the superset check catches it.
      courses: [
        course({
          liveLessonCount: 3,
          activeLessonsOrCount: bitsToHex([0, 1, 4]),
        }),
      ],
      enrollments: [enrollment({ lessonFlags: bitsToHex([0, 1, 2]) })],
    });

    const result = verifyReset(pre, post, EXPECTED);

    expect(result.ok).toBe(false);
    const courseResult = result.perCourse[0];
    expect(courseResult?.ok).toBe(false);
    expect(
      courseResult?.failures.some(
        (f) => f.includes("[H3]") && f.includes(enrollment().address)
      )
    ).toBe(true);
    // The enrollment itself is untouched (same address, same flags) — this is
    // purely a course-level H3 violation, not an enrollment drift.
    expect(result.perEnrollment[0]?.ok).toBe(true);
  });

  it("does not flag H3 when the post mask fully covers every learner's bits (a strict superset is fine)", () => {
    const pre = snapshot({
      courses: [
        course({ liveLessonCount: 2, activeLessonsOrCount: bitsToHex([0, 1]) }),
      ],
      enrollments: [enrollment({ lessonFlags: bitsToHex([0, 1]) })],
    });
    // This scenario intentionally violates H3a (popcount 2 -> 2 must match —
    // here we keep popcount equal to isolate the superset check as passing).
    const post = snapshot({
      courses: [
        course({ liveLessonCount: 2, activeLessonsOrCount: bitsToHex([0, 1]) }),
      ],
      enrollments: [enrollment({ lessonFlags: bitsToHex([0, 1]) })],
    });

    const result = verifyReset(pre, post, EXPECTED);
    expect(result.ok).toBe(true);
  });
});

describe("verifyReset — (d) enrollment lessonFlags drift", () => {
  it("flags an enrollment whose lessonFlags changed between pre and post", () => {
    const pre = snapshot({
      courses: [course()],
      enrollments: [enrollment({ lessonFlags: bitsToHex([0, 1]) })],
    });
    const post = snapshot({
      courses: [course()],
      // Same address, DIFFERENT flags — must never happen (recreate never
      // touches Enrollment PDAs), so this is flagged.
      enrollments: [enrollment({ lessonFlags: bitsToHex([0, 1, 2]) })],
    });

    const result = verifyReset(pre, post, EXPECTED);

    expect(result.ok).toBe(false);
    const enrollmentResult = result.perEnrollment[0];
    expect(enrollmentResult?.ok).toBe(false);
    expect(
      enrollmentResult?.failures.some((f) => f.includes("lessonFlags changed"))
    ).toBe(true);
  });

  it("flags an enrollment whose course field changed", () => {
    const pre = snapshot({
      courses: [course()],
      enrollments: [enrollment({ course: COURSE_PDA })],
    });
    const post = snapshot({
      courses: [course()],
      enrollments: [enrollment({ course: OTHER_COURSE_PDA })],
    });

    const result = verifyReset(pre, post, EXPECTED);

    expect(result.ok).toBe(false);
    expect(
      result.perEnrollment[0]?.failures.some((f) =>
        f.includes("course changed")
      )
    ).toBe(true);
  });
});

describe("verifyReset — (e) missing enrollment", () => {
  it("flags a pre enrollment absent from the post snapshot", () => {
    const pre = snapshot({
      courses: [course()],
      enrollments: [enrollment()],
    });
    const post = snapshot({
      courses: [course()],
      enrollments: [], // dropped
    });

    const result = verifyReset(pre, post, EXPECTED);

    expect(result.ok).toBe(false);
    const enrollmentResult = result.perEnrollment[0];
    expect(enrollmentResult?.ok).toBe(false);
    expect(
      enrollmentResult?.failures.some((f) => f.includes("missing from POST"))
    ).toBe(true);
  });

  it("never flags a post-only enrollment with no pre counterpart (ordinary new signups)", () => {
    const pre = snapshot({ courses: [course()], enrollments: [] });
    const post = snapshot({
      courses: [course()],
      enrollments: [
        enrollment({ address: "BrandNewEnrollment111111111111111111111111" }),
      ],
    });

    const result = verifyReset(pre, post, EXPECTED);

    expect(result.ok).toBe(true);
    expect(result.perEnrollment).toEqual([]);
  });
});

describe("verifyReset — (f) wrong creator / reward ≠ 30", () => {
  it("flags a course whose post creator does not match the expected instructor wallet", () => {
    const pre = snapshot({ courses: [course()] });
    const post = snapshot({ courses: [course({ creator: OTHER_CREATOR })] });

    const result = verifyReset(pre, post, EXPECTED);

    expect(result.ok).toBe(false);
    expect(
      result.perCourse[0]?.failures.some((f) => f.includes("creator="))
    ).toBe(true);
  });

  it("flags a course whose post creatorRewardXp is not 30", () => {
    const pre = snapshot({ courses: [course()] });
    const post = snapshot({ courses: [course({ creatorRewardXp: 750 })] });

    const result = verifyReset(pre, post, EXPECTED);

    expect(result.ok).toBe(false);
    expect(
      result.perCourse[0]?.failures.some((f) =>
        f.includes("creatorRewardXp=750")
      )
    ).toBe(true);
  });

  it("flags a course whose post size is not the expected v-next size", () => {
    const pre = snapshot({ courses: [course()] });
    const post = snapshot({ courses: [course({ sizeBytes: COURSE_SIZE_V1 })] });

    const result = verifyReset(pre, post, EXPECTED);

    expect(result.ok).toBe(false);
    expect(
      result.perCourse[0]?.failures.some((f) => f.includes("sizeBytes="))
    ).toBe(true);
  });
});

describe("verifyReset — fail-closed on missing baseline data", () => {
  it("flags a course present in `expected` but absent from the POST snapshot", () => {
    const pre = snapshot({ courses: [course()] });
    const post = snapshot({ courses: [] });

    const result = verifyReset(pre, post, EXPECTED);

    expect(result.ok).toBe(false);
    expect(
      result.perCourse[0]?.failures.some((f) => f.includes("missing from POST"))
    ).toBe(true);
  });

  it("flags a course present in `expected` but absent from the PRE snapshot (no baseline to verify H3 against)", () => {
    const pre = snapshot({ courses: [] });
    const post = snapshot({ courses: [course()] });

    const result = verifyReset(pre, post, EXPECTED);

    expect(result.ok).toBe(false);
    expect(
      result.perCourse[0]?.failures.some((f) => f.includes("missing from PRE"))
    ).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// snapshotOnChainState — getProgramAccounts + decode plumbing
// -----------------------------------------------------------------------------

const coderV1 = new BorshCoder(IDL as unknown as Idl);
const coderVNext = new BorshCoder(VNEXT_IDL as unknown as Idl);

function padToSize(buf: Buffer, size: number): Buffer {
  const out = Buffer.alloc(size);
  buf.copy(out);
  return out;
}

async function encodeV1Course(): Promise<Buffer> {
  const raw = await coderV1.accounts.encode("Course", {
    course_id: "course-v1",
    creator: PublicKey.unique(),
    content_tx_id: Array(32).fill(1),
    version: 1,
    lesson_count: 5,
    difficulty: 1,
    xp_per_lesson: 10,
    track_id: 0,
    track_level: 0,
    prerequisite: null,
    creator_reward_xp: 30,
    min_completions_for_reward: 0,
    total_completions: 0,
    total_enrollments: 0,
    is_active: true,
    created_at: new BN(1),
    updated_at: new BN(1),
    collection: PublicKey.unique(),
    _reserved: Array(8).fill(0),
    bump: 255,
  });
  return padToSize(raw, COURSE_SIZE_V1);
}

async function encodeVNextCourse(): Promise<Buffer> {
  const raw = await coderVNext.accounts.encode("Course", {
    course_id: "course-vnext",
    creator: PublicKey.unique(),
    content_tx_id: Array(32).fill(2),
    version: 1,
    active_lessons: [new BN(0b111), new BN(0), new BN(0), new BN(0)],
    difficulty: 1,
    xp_per_lesson: 10,
    track_id: 0,
    track_level: 0,
    prerequisite: null,
    creator_reward_xp: 30,
    total_completions: 0,
    total_enrollments: 0,
    is_active: true,
    created_at: new BN(1),
    updated_at: new BN(1),
    collection: PublicKey.unique(),
    _reserved: Array(8).fill(0),
    bump: 254,
  });
  return padToSize(raw, COURSE_SIZE_VNEXT);
}

async function encodeEnrollment(courseKey: PublicKey): Promise<Buffer> {
  const raw = await coderV1.accounts.encode("Enrollment", {
    course: courseKey,
    enrolled_at: new BN(1),
    completed_at: null,
    lesson_flags: [new BN(0b11), new BN(0), new BN(0), new BN(0)],
    credential_asset: null,
    _reserved: Array(4).fill(0),
    bump: 255,
  });
  // Enrollment has no variable-length field, so it is already the exact size.
  return raw;
}

describe("snapshotOnChainState", () => {
  it("decodes both v1 and v-next Course accounts, plus Enrollment accounts, in one snapshot", async () => {
    const v1Key = PublicKey.unique();
    const vNextKey = PublicKey.unique();
    const enrollmentKey = PublicKey.unique();

    const v1Data = await encodeV1Course();
    const vNextData = await encodeVNextCourse();
    const enrollmentData = await encodeEnrollment(vNextKey);

    const getProgramAccounts = vi
      .fn()
      .mockImplementationOnce(async () => [
        { pubkey: v1Key, account: { data: v1Data } },
        { pubkey: vNextKey, account: { data: vNextData } },
      ])
      .mockImplementationOnce(async () => [
        { pubkey: enrollmentKey, account: { data: enrollmentData } },
      ]);

    const connection = {
      getProgramAccounts,
    } as unknown as import("@solana/web3.js").Connection;
    const programId = PublicKey.unique();

    const result = await snapshotOnChainState(connection, programId);

    expect(result.courses).toHaveLength(2);
    expect(result.undecodedCourses).toEqual([]);
    const v1 = result.courses.find((c) => c.courseId === "course-v1");
    const vNext = result.courses.find((c) => c.courseId === "course-vnext");
    expect(v1?.sizeBytes).toBe(COURSE_SIZE_V1);
    expect(v1?.liveLessonCount).toBe(5);
    expect(vNext?.sizeBytes).toBe(COURSE_SIZE_VNEXT);
    expect(vNext?.liveLessonCount).toBe(3);

    expect(result.enrollments).toHaveLength(1);
    expect(result.undecodedEnrollments).toEqual([]);
    expect(result.enrollments[0]?.course).toBe(vNextKey.toBase58());
    expect(result.enrollments[0]?.lessonFlags.endsWith("3")).toBe(true);

    expect(getProgramAccounts).toHaveBeenCalledTimes(2);
    expect(getProgramAccounts).toHaveBeenCalledWith(
      programId,
      expect.objectContaining({ filters: expect.any(Array) })
    );
  });

  it("reports an account matching the discriminator but with an unrecognised length as undecoded, without dropping the rest of the snapshot", async () => {
    const goodKey = PublicKey.unique();
    const badKey = PublicKey.unique();
    const goodData = await encodeV1Course();
    const badData = Buffer.alloc(100); // matches nothing decodeCourse recognises

    const getProgramAccounts = vi
      .fn()
      .mockImplementationOnce(async () => [
        { pubkey: goodKey, account: { data: goodData } },
        { pubkey: badKey, account: { data: badData } },
      ])
      .mockImplementationOnce(async () => []);

    const connection = {
      getProgramAccounts,
    } as unknown as import("@solana/web3.js").Connection;

    const result = await snapshotOnChainState(connection, PublicKey.unique());

    expect(result.courses).toHaveLength(1);
    expect(result.courses[0]?.courseId).toBe("course-v1");
    expect(result.undecodedCourses).toHaveLength(1);
    expect(result.undecodedCourses[0]?.address).toBe(badKey.toBase58());
    expect(result.undecodedCourses[0]?.sizeBytes).toBe(100);
    expect(result.undecodedCourses[0]?.error).toMatch(/100/);
  });
});
