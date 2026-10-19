import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({}) }));

// Two seams: which courses are synced+active, and a fixture store holding one
// live path. Everything between them — path membership, per-course lesson
// counts, `isSynced` itself (it IS the gate under test) — runs through the real
// queries, because the regression this file locks in only appears when path
// membership meets the sync gate.
const deployments = new Map<string, { status: string; is_active: boolean }>();
vi.mock("@/lib/content/deployments", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/content/deployments")>();
  return {
    ...actual,
    getActiveDeployments: vi.fn(async () => deployments),
  };
});

vi.mock("@/lib/content/store", () => {
  const ref = (id: string) => ({ _ref: id, _type: "reference", _weak: true });
  const course = (id: string) => ({
    _id: id,
    _type: "course",
    slug: { _type: "slug", current: id },
    title: id,
    modules: [{ key: "m", title: "M", lessons: [ref(`lesson-${id}`)] }],
  });
  const courses = ["course-live-a", "course-live-b", "course-staged"].map(
    course
  );
  const path = {
    _id: "path-shelf",
    _type: "learningPath",
    title: "Shelf",
    order: 1,
    courses: courses.map((c) => ref(c._id)),
  };
  return {
    coursesById: new Map(courses.map((c) => [c._id, c])),
    lessonsById: new Map(),
    pathsById: new Map([[path._id, path]]),
  };
});

import { buildUserState } from "../achievements";

/**
 * One live path with three members. `UNSYNCED` plays the role C1 did on the
 * #892 wave: a member staged into the path with no on-chain deployment row.
 */
const PATH = "path-shelf";
const UNSYNCED = "course-staged";
const LIVE_MEMBERS = ["course-live-a", "course-live-b"];

function sync(...courseIds: string[]) {
  deployments.clear();
  for (const id of courseIds)
    deployments.set(id, { status: "synced", is_active: true });
}

/**
 * Minimal chainable stand-in for the service-role client. Awaiting a chain
 * yields the list result; `.single()` yields the row result. `profiles` is read
 * both ways (row for `created_at`, count for `userNumber`), which is exactly
 * why the two are separate.
 */
function makeAdmin(completedCourseIds: readonly string[]) {
  const results: Record<string, { row?: unknown; list?: unknown }> = {
    user_xp: { row: { data: { current_streak: 0 } } },
    user_progress: { list: { data: [] } },
    enrollments: {
      list: {
        data: completedCourseIds.map((course_id) => ({
          course_id,
          completed_at: "2026-07-30T00:00:00Z",
        })),
      },
    },
    community_stats: { row: { data: null } },
    profiles: {
      row: { data: { created_at: "2026-01-01T00:00:00Z" } },
      list: { count: 1, data: [] },
    },
  };

  const from = (table: string) => {
    const res = results[table] ?? {};
    const chain = {
      select: () => chain,
      eq: () => chain,
      lte: () => chain,
      single: () => Promise.resolve(res.row ?? { data: null }),
      then: (onOk: (v: unknown) => unknown, onErr?: (e: unknown) => unknown) =>
        Promise.resolve(res.list ?? { data: [] }).then(onOk, onErr),
    };
    return chain;
  };

  return { from } as unknown as Parameters<typeof buildUserState>[0];
}

beforeEach(() => deployments.clear());

describe("buildUserState — path completion is gated by the sync set (#892)", () => {
  it("an UNSYNCED member does not block the path for a learner who finished every live member", async () => {
    // The shape the #892 content wave introduced: a member is staged into the
    // live path but has no on-chain deployment row. RED before the fix — the
    // raw `path.courseIds.every(...)` required it, and it can never enter
    // `completedCourseIds` (that set is synced+active-only), so the path — and
    // the path-completed achievement with it — became unsatisfiable.
    sync(...LIVE_MEMBERS);
    const state = await buildUserState(makeAdmin(LIVE_MEMBERS), "user-1");

    expect(state.completedCourseIds.has(UNSYNCED)).toBe(false);
    expect(state.completedPathIds.has(PATH)).toBe(true);
  });

  it("a path whose synced membership is EMPTY never counts as completed", async () => {
    // Guards the vacuous `.every([])  === true` case: with nothing synced, the
    // filtered membership is empty and the path must NOT complete — not even
    // for a learner credited with every course in it.
    sync();
    const state = await buildUserState(
      makeAdmin([UNSYNCED, ...LIVE_MEMBERS]),
      "user-2"
    );

    expect(state.completedPathIds.has(PATH)).toBe(false);
  });

  it("a SYNCED member that is unfinished still blocks the path", async () => {
    // The gate loosens membership, never the completion requirement.
    sync(UNSYNCED, ...LIVE_MEMBERS);
    const state = await buildUserState(makeAdmin(LIVE_MEMBERS), "user-3");

    expect(state.completedPathIds.has(PATH)).toBe(false);
  });
});
