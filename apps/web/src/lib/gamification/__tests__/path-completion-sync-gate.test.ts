import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({}) }));

// The ONE seam this suite controls: which courses are synced+active. Everything
// else — learning-path membership, per-course lesson counts — comes from the
// REAL committed bundle through the REAL queries, because the regression this
// file locks in only appears when real path membership meets the sync gate.
// `isSynced` itself stays real (it IS the gate under test).
const deployments = new Map<string, { status: string; is_active: boolean }>();
vi.mock("@/lib/content/deployments", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/content/deployments")>();
  return {
    ...actual,
    getActiveDeployments: vi.fn(async () => deployments),
  };
});

import { buildUserState } from "../achievements";

/** The live path this wave touches, and its real bundle membership. */
const PATH = "path-zero-to-deployed";
const C1 = "course-solana-for-web-devs";
const LIVE_MEMBERS = [
  "course-rust-for-program-devs",
  "course-building-first-program",
  "course-dapp-sdk-kit",
  "course-stablecoin-payments",
];

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
    // The exact shape this content wave introduces: C1 is staged into the live
    // path but has no on-chain deployment row. RED before the fix — the raw
    // `path.courseIds.every(...)` required C1, which can never enter
    // `completedCourseIds` (that set is synced+active-only), so the path — and
    // `achievement-full-stack-solana` with it — became unsatisfiable.
    sync(...LIVE_MEMBERS);
    const state = await buildUserState(makeAdmin(LIVE_MEMBERS), "user-1");

    expect(state.completedCourseIds.has(C1)).toBe(false);
    expect(state.completedPathIds.has(PATH)).toBe(true);
  });

  it("a path whose synced membership is EMPTY never counts as completed", async () => {
    // Guards the vacuous `.every([])  === true` case: with nothing synced, the
    // filtered membership is empty and the path must NOT complete — not even
    // for a learner credited with every course in it.
    sync();
    const state = await buildUserState(
      makeAdmin([C1, ...LIVE_MEMBERS]),
      "user-2"
    );

    expect(state.completedPathIds.has(PATH)).toBe(false);
  });

  it("a SYNCED member that is unfinished still blocks the path", async () => {
    // The gate loosens membership, never the completion requirement.
    sync(C1, ...LIVE_MEMBERS);
    const state = await buildUserState(makeAdmin(LIVE_MEMBERS), "user-3");

    expect(state.completedPathIds.has(PATH)).toBe(false);
  });
});
