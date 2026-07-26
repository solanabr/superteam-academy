import { describe, it, expect, vi, beforeEach } from "vitest";

// #654: read seam — decodes course_changelog rows into the discriminated entry
// union through the RLS-respecting server client, dropping rows whose detail
// doesn't match their kind. Mock the server client to feed it raw rows.

vi.mock("server-only", () => ({}));

let rows: Array<Record<string, unknown>> = [];
let queryError: { message: string } | null = null;
let lastCourseId: string | null = null;

// Minimal thenable query builder: every filter/order returns `this`, and
// awaiting it yields { data, error }.
const builder: Record<string, unknown> = {};
for (const m of ["select", "order", "limit"]) {
  builder[m] = vi.fn(() => builder);
}
builder.eq = vi.fn((_col: string, val: string) => {
  lastCourseId = val;
  return builder;
});
builder.then = (resolve: (v: unknown) => unknown) =>
  resolve({ data: queryError ? null : rows, error: queryError });

const fromFn = vi.fn(() => builder);

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve({ from: fromFn }),
}));

import { getCourseChangelog } from "../changelog";

beforeEach(() => {
  rows = [];
  queryError = null;
  lastCourseId = null;
  fromFn.mockClear();
});

describe("getCourseChangelog", () => {
  it("filters by the exact course id and reads from course_changelog", async () => {
    await getCourseChangelog("course-x");
    expect(fromFn).toHaveBeenCalledWith("course_changelog");
    expect(lastCourseId).toBe("course-x");
  });

  it("decodes each kind into its typed detail", async () => {
    rows = [
      {
        id: 4,
        kind: "xp_changed",
        version: 3,
        detail: { from: 10, to: 20 },
        tx_signature: "S4",
        created_at: "2026-07-26T00:00:00Z",
      },
      {
        id: 3,
        kind: "lessons_added",
        version: 3,
        detail: { lessons: [{ slot: 2, id: "lesson-c", title: "Advanced" }] },
        tx_signature: "S3",
        created_at: "2026-07-25T00:00:00Z",
      },
      {
        id: 1,
        kind: "deployed",
        version: 1,
        detail: { lessonCount: 5 },
        tx_signature: "S1",
        created_at: "2026-07-24T00:00:00Z",
      },
    ];
    const entries = await getCourseChangelog("course-x");
    expect(entries).toHaveLength(3);
    expect(entries[0]).toMatchObject({
      kind: "xp_changed",
      detail: { from: 10, to: 20 },
    });
    expect(entries[1]).toMatchObject({
      kind: "lessons_added",
      detail: { lessons: [{ slot: 2, id: "lesson-c", title: "Advanced" }] },
    });
    expect(entries[2]).toMatchObject({
      kind: "deployed",
      detail: { lessonCount: 5 },
    });
  });

  it("drops a row whose detail does not match its kind", async () => {
    rows = [
      {
        id: 2,
        kind: "xp_changed",
        version: 1,
        detail: { nope: true }, // missing from/to
        tx_signature: "S2",
        created_at: "2026-07-26T00:00:00Z",
      },
      {
        id: 1,
        kind: "lessons_added",
        version: 1,
        detail: { lessons: [{ slot: 0, id: null, title: null }] },
        tx_signature: "S1",
        created_at: "2026-07-25T00:00:00Z",
      },
    ];
    const entries = await getCourseChangelog("course-x");
    expect(entries.map((e) => e.kind)).toEqual(["lessons_added"]);
  });

  it("returns [] on a query error (never breaks the course page)", async () => {
    queryError = { message: "down" };
    expect(await getCourseChangelog("course-x")).toEqual([]);
  });

  it("returns [] when the course has no recorded changes", async () => {
    rows = [];
    expect(await getCourseChangelog("course-x")).toEqual([]);
  });

  it("decodes the #738 status + recreate kinds", async () => {
    rows = [
      {
        id: 3,
        kind: "reactivated",
        version: 4,
        detail: {},
        tx_signature: "S3",
        created_at: "2026-07-26T03:00:00Z",
      },
      {
        id: 2,
        kind: "recreated",
        version: 1,
        detail: { lessonCount: 7 },
        tx_signature: "S2",
        created_at: "2026-07-26T02:00:00Z",
      },
      {
        id: 1,
        kind: "deactivated",
        version: 4,
        detail: {},
        tx_signature: "S1",
        created_at: "2026-07-26T01:00:00Z",
      },
    ];
    const entries = await getCourseChangelog("course-x");
    expect(entries.map((e) => e.kind)).toEqual([
      "reactivated",
      "recreated",
      "deactivated",
    ]);
    const recreated = entries.find((e) => e.kind === "recreated");
    expect(recreated?.detail).toEqual({ lessonCount: 7 });
  });
});
