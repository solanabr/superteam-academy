import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { MaskMismatchError } from "@/lib/github/types";
import { buildCourseCommit } from "@/lib/solana/admin-signer";

const sha = "c".repeat(40);
const slots = { version: 1, slots: { a: 0, b: 1 }, retired: [], next: 2 };

describe("buildCourseCommit", () => {
  it("packs the sha into 32 bytes and passes through a mask that matches the lockfile", () => {
    const commit = buildCourseCommit({
      courseId: "course-x",
      contentSha: sha,
      slotsLock: slots,
      activeLessons: [3n, 0n, 0n, 0n], // bits 0 and 1 — matches slots a:0, b:1
    });
    expect(commit.contentTxId).toHaveLength(32);
    expect(commit.activeLessons[0]).toBe(3n);
  });

  it("throws MaskMismatchError naming the course when the caller's mask disagrees with the lockfile", () => {
    expect(() =>
      buildCourseCommit({
        courseId: "course-x",
        contentSha: sha,
        slotsLock: slots,
        activeLessons: [1n, 0n, 0n, 0n], // bit 1 missing — panel bug
      })
    ).toThrow(MaskMismatchError);
    try {
      buildCourseCommit({
        courseId: "course-x",
        contentSha: sha,
        slotsLock: slots,
        activeLessons: [1n, 0n, 0n, 0n],
      });
    } catch (e) {
      expect((e as Error).message).toContain("course-x"); // reports the course id, not a sha
    }
  });
});
