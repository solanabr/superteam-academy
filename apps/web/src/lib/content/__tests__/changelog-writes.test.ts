import { describe, it, expect, vi, beforeEach } from "vitest";

// #654: capture seam records course-evolution rows at mutation time. Mock the
// service-role client + the content bundle so we can assert exactly which rows
// each mutation kind writes, with title snapshots resolved from the bundle.

vi.mock("server-only", () => ({}));

let lastTable: string | null = null;
let lastRows: Array<Record<string, unknown>> | null = null;
let lastOptions: Record<string, unknown> | null = null;
let upsertError: { message: string } | null = null;

const upsert = vi.fn(
  (rows: Array<Record<string, unknown>>, options: Record<string, unknown>) => {
    lastRows = rows;
    lastOptions = options;
    return Promise.resolve({ error: upsertError });
  }
);

const fromFn = vi.fn((table: string) => {
  lastTable = table;
  return { upsert };
});

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: fromFn }),
}));

// Three lessons at slots 0/1/2; slot 3 is deliberately unmapped so a removed
// bit with no bundle lesson exercises the null-title fallback.
vi.mock("@/lib/content/store", () => ({
  slotsByCourseId: new Map([
    [
      "course-x",
      {
        version: 1,
        next: 3,
        retired: [],
        slots: { "lesson-a": 0, "lesson-b": 1, "lesson-c": 2 },
      },
    ],
  ]),
  lessonsById: new Map([
    ["lesson-a", { _id: "lesson-a", title: "Intro" }],
    ["lesson-b", { _id: "lesson-b", title: "Basics" }],
    ["lesson-c", { _id: "lesson-c", title: "Advanced" }],
  ]),
}));

import { recordCourseDeployed, recordCourseUpdate } from "../changelog-writes";

/** Build a single-word mask from a list of slot indices (all < 64). */
function mask(...slots: number[]): bigint[] {
  let w = 0n;
  for (const s of slots) w |= 1n << BigInt(s);
  return [w, 0n, 0n, 0n];
}

beforeEach(() => {
  lastTable = null;
  lastRows = null;
  lastOptions = null;
  upsertError = null;
  upsert.mockClear();
  fromFn.mockClear();
});

describe("recordCourseDeployed", () => {
  it("writes a single deployed row at version 1 with the lesson count", async () => {
    await recordCourseDeployed({
      courseId: "course-x",
      txSignature: "SIG_DEPLOY",
      lessonCount: 3,
    });

    expect(lastTable).toBe("course_changelog");
    expect(lastRows).toHaveLength(1);
    expect(lastRows?.[0]).toMatchObject({
      course_id: "course-x",
      kind: "deployed",
      version: 1,
      tx_signature: "SIG_DEPLOY",
      detail: { lessonCount: 3 },
    });
  });

  it("upserts idempotently on (course_id, kind, tx_signature)", async () => {
    await recordCourseDeployed({
      courseId: "course-x",
      txSignature: "SIG",
      lessonCount: 1,
    });
    expect(lastOptions).toEqual({
      onConflict: "course_id,kind,tx_signature",
      ignoreDuplicates: true,
    });
  });
});

describe("recordCourseUpdate", () => {
  const baseUpdate = {
    courseId: "course-x",
    txSignature: "SIG_UPDATE",
    oldXp: 10,
    contentCommitted: true,
    newVersion: 2,
    contentSha: "abc123",
  };

  it("records lessons_added with title snapshots for newly-live slots", async () => {
    await recordCourseUpdate({
      ...baseUpdate,
      oldMask: mask(0, 1),
      newMask: mask(0, 1, 2),
    });

    const added = lastRows?.find((r) => r.kind === "lessons_added");
    expect(added).toBeDefined();
    expect(added).toMatchObject({ course_id: "course-x", version: 2 });
    expect(added?.detail).toEqual({
      lessons: [{ slot: 2, id: "lesson-c", title: "Advanced" }],
    });
    // No removed/xp/content rows when only lessons were added.
    expect(lastRows?.some((r) => r.kind === "lessons_removed")).toBe(false);
    expect(lastRows?.some((r) => r.kind === "content_updated")).toBe(false);
    expect(lastRows?.some((r) => r.kind === "xp_changed")).toBe(false);
  });

  it("records lessons_removed, falling back to slot when a slot is unmapped", async () => {
    await recordCourseUpdate({
      ...baseUpdate,
      oldMask: mask(0, 1, 2, 3),
      newMask: mask(0, 1),
    });

    const removed = lastRows?.find((r) => r.kind === "lessons_removed");
    expect(removed?.detail).toEqual({
      lessons: [
        { slot: 2, id: "lesson-c", title: "Advanced" },
        { slot: 3, id: null, title: null },
      ],
    });
  });

  it("records content_updated only when the live set did NOT change", async () => {
    await recordCourseUpdate({
      ...baseUpdate,
      oldMask: mask(0, 1),
      newMask: mask(0, 1), // unchanged
    });

    expect(lastRows?.map((r) => r.kind)).toEqual(["content_updated"]);
    expect(lastRows?.[0]?.detail).toEqual({ sha: "abc123" });
  });

  it("does NOT emit content_updated alongside a lesson change (avoids redundancy)", async () => {
    await recordCourseUpdate({
      ...baseUpdate,
      oldMask: mask(0),
      newMask: mask(0, 1),
    });

    expect(lastRows?.some((r) => r.kind === "content_updated")).toBe(false);
    expect(lastRows?.some((r) => r.kind === "lessons_added")).toBe(true);
  });

  it("records xp_changed only on a real delta, with from/to", async () => {
    await recordCourseUpdate({
      ...baseUpdate,
      oldMask: mask(0),
      newMask: mask(0),
      oldXp: 10,
      newXp: 25,
    });
    const xp = lastRows?.find((r) => r.kind === "xp_changed");
    expect(xp?.detail).toEqual({ from: 10, to: 25 });
  });

  it("omits xp_changed when the value is unchanged", async () => {
    await recordCourseUpdate({
      ...baseUpdate,
      oldMask: mask(0),
      newMask: mask(0),
      oldXp: 10,
      newXp: 10,
      contentCommitted: false, // no content row either
    });
    expect(lastRows ?? []).toHaveLength(0);
    // Nothing meaningful changed → no write at all.
    expect(upsert).not.toHaveBeenCalled();
  });

  it("emits BOTH a lesson row and an xp row for a combined update", async () => {
    await recordCourseUpdate({
      ...baseUpdate,
      oldMask: mask(0, 1),
      newMask: mask(0, 1, 2),
      oldXp: 10,
      newXp: 20,
    });
    const kinds = (lastRows ?? []).map((r) => r.kind).sort();
    expect(kinds).toEqual(["lessons_added", "xp_changed"]);
    // Both share the same tx + version (one on-chain update).
    for (const row of lastRows ?? []) {
      expect(row).toMatchObject({ tx_signature: "SIG_UPDATE", version: 2 });
    }
  });

  it("does not throw when the upsert errors (non-fatal capture)", async () => {
    upsertError = { message: "boom" };
    await expect(
      recordCourseUpdate({
        ...baseUpdate,
        oldMask: mask(0),
        newMask: mask(0, 1),
      })
    ).resolves.toBeUndefined();
  });
});
