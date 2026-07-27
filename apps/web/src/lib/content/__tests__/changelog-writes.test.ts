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

import {
  recordCourseDeployed,
  recordCourseUpdate,
  recordCourseChange,
  recordCourseDeactivated,
  recordCourseReactivated,
  recordCourseRecreated,
} from "../changelog-writes";

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

describe("#738 status + recreate recorders", () => {
  it("recordCourseChange writes one row through the shared low-level seam", async () => {
    await recordCourseChange({
      courseId: "course-x",
      kind: "deactivated",
      version: 3,
      txSignature: "SIG",
    });
    expect(lastTable).toBe("course_changelog");
    expect(lastRows).toHaveLength(1);
    expect(lastRows?.[0]).toMatchObject({
      course_id: "course-x",
      kind: "deactivated",
      version: 3,
      tx_signature: "SIG",
      detail: {},
    });
    // Same idempotency contract as every other recorder.
    expect(lastOptions).toEqual({
      onConflict: "course_id,kind,tx_signature",
      ignoreDuplicates: true,
    });
  });

  it("recordCourseDeactivated logs a deactivated row at the current version", async () => {
    await recordCourseDeactivated({
      courseId: "course-x",
      txSignature: "SIG_D",
      version: 5,
    });
    expect(lastRows?.[0]).toMatchObject({
      kind: "deactivated",
      version: 5,
      tx_signature: "SIG_D",
      detail: {},
    });
  });

  it("recordCourseReactivated logs a reactivated row at the current version", async () => {
    await recordCourseReactivated({
      courseId: "course-x",
      txSignature: "SIG_R",
      version: 5,
    });
    expect(lastRows?.[0]).toMatchObject({
      kind: "reactivated",
      version: 5,
      tx_signature: "SIG_R",
      detail: {},
    });
  });

  it("recordCourseRecreated logs at version 1 with the preserved lesson count", async () => {
    // create_course resets version to 1; lessonCount is the H3-preserved live count.
    await recordCourseRecreated({
      courseId: "course-x",
      txSignature: "SIG_CREATE",
      lessonCount: 7,
    });
    expect(lastRows?.[0]).toMatchObject({
      kind: "recreated",
      version: 1,
      tx_signature: "SIG_CREATE",
      detail: { lessonCount: 7 },
    });
  });

  it("status recorders are non-fatal when the upsert errors", async () => {
    upsertError = { message: "boom" };
    await expect(
      recordCourseDeactivated({
        courseId: "course-x",
        txSignature: "SIG",
        version: 1,
      })
    ).resolves.toBeUndefined();
  });
});

describe("#757 removed-lesson id/title from prior state", () => {
  const baseUpdate = {
    courseId: "course-x",
    txSignature: "SIG_UPDATE",
    oldXp: 10,
    contentCommitted: true,
    newVersion: 4,
    contentSha: "abc123",
  };

  it("uses priorRemoved for removed slots (id + title), overriding the null bundle miss", async () => {
    const priorRemoved = new Map([
      [3, { id: "lesson-gone", title: "A Retired Lesson" }],
    ]);
    await recordCourseUpdate({
      ...baseUpdate,
      oldMask: mask(0, 1, 3),
      newMask: mask(0, 1), // slot 3 removed; absent from the current bundle
      priorRemoved,
    });
    const removed = lastRows?.find((r) => r.kind === "lessons_removed");
    expect(removed?.detail).toEqual({
      lessons: [{ slot: 3, id: "lesson-gone", title: "A Retired Lesson" }],
    });
  });

  it("still records slot-only when priorRemoved lacks the slot (never fabricates)", async () => {
    await recordCourseUpdate({
      ...baseUpdate,
      oldMask: mask(0, 1, 3),
      newMask: mask(0, 1),
      priorRemoved: new Map(), // resolver degraded / slot unresolved
    });
    const removed = lastRows?.find((r) => r.kind === "lessons_removed");
    expect(removed?.detail).toEqual({
      lessons: [{ slot: 3, id: null, title: null }],
    });
  });

  it("reproduces the exact C3 prod case (tx 5T1jeJ68) — full removed entries, no nulls", async () => {
    // Live-before: slots 0..15. Live-now: remove {0,2,11,14}, add {16,17,18}.
    const priorRemoved = new Map([
      [
        0,
        { id: "lesson-bfsp-from-code-to-chain", title: "From Code to Chain" },
      ],
      [
        2,
        {
          id: "lesson-bfsp-anatomy-anchor-program",
          title: "Anatomy of an Anchor Program",
        },
      ],
      [11, { id: "lesson-bfsp-deploy-to-devnet", title: "Deploy to Devnet" }],
      [
        14,
        { id: "lesson-bfsp-m4-interact", title: "Interact with Your Program" },
      ],
    ]);
    await recordCourseUpdate({
      ...baseUpdate,
      oldMask: mask(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15),
      newMask: mask(1, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 15, 16, 17, 18),
      priorRemoved,
    });
    const removed = lastRows?.find((r) => r.kind === "lessons_removed");
    const lessons = (
      removed?.detail as { lessons: Array<Record<string, unknown>> }
    ).lessons;
    // The exact prod regression (all id:null/title:null) is gone.
    expect(lessons.every((l) => l.id !== null && l.title !== null)).toBe(true);
    expect(lessons).toEqual([
      {
        slot: 0,
        id: "lesson-bfsp-from-code-to-chain",
        title: "From Code to Chain",
      },
      {
        slot: 2,
        id: "lesson-bfsp-anatomy-anchor-program",
        title: "Anatomy of an Anchor Program",
      },
      {
        slot: 11,
        id: "lesson-bfsp-deploy-to-devnet",
        title: "Deploy to Devnet",
      },
      {
        slot: 14,
        id: "lesson-bfsp-m4-interact",
        title: "Interact with Your Program",
      },
    ]);

    // Cross-contamination pin: added lessons resolve from the CURRENT bundle
    // ONLY — priorRemoved (slots 0/2/11/14) must never bleed into the added
    // row. Slots 16/17/18 aren't in the test bundle, so they stay slot-only.
    const added = lastRows?.find((r) => r.kind === "lessons_added");
    expect(added?.detail).toEqual({
      lessons: [
        { slot: 16, id: null, title: null },
        { slot: 17, id: null, title: null },
        { slot: 18, id: null, title: null },
      ],
    });
  });
});
