/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the module import so the `server-only` graph loads under vitest. */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => ({
  preflightRecreate: vi.fn(),
  getAllCoursesAdmin: vi.fn(),
  fetchCourse: vi.fn(),
  diffCourse: vi.fn(),
}));

vi.mock("@/lib/env.server", () => ({
  serverEnv: { SOLANA_RPC_URL: "https://api.devnet.solana.com" },
}));

// Keep the REAL RecreateCourseError (the helper branches on `instanceof`); stub
// only preflightRecreate so no on-chain read happens.
vi.mock("@/lib/admin/recreate-course", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/admin/recreate-course")>();
  return { ...actual, preflightRecreate: h.preflightRecreate };
});

vi.mock("@/lib/content/queries", () => ({
  getAllCoursesAdmin: h.getAllCoursesAdmin,
}));

vi.mock("@/lib/solana/academy-reads", () => ({
  fetchCourse: h.fetchCourse,
}));

vi.mock("@/lib/solana/pda", () => ({
  getProgramId: () => "ProgRam1111111111111111111111111111111111111",
}));

vi.mock("@/lib/admin/sync-diff", () => ({
  diffCourse: h.diffCourse,
}));

import { RecreateCourseError } from "@/lib/admin/recreate-course";
import { buildRecreatePreflight } from "@/lib/admin/recreate-preflight";

const COURSE_ID = "course-solana-101";

function plan(overrides: Record<string, unknown> = {}) {
  return {
    courseId: COURSE_ID,
    coursePda: { toBase58: () => "PDA111" },
    snapshot: {
      totalCompletions: 42,
      totalEnrollments: 100,
      isActive: true,
      collection: null,
    },
    createParams: {
      courseId: COURSE_ID,
      lessonCount: 3,
      creatorWallet: "CREATOR111",
      prerequisitePda: undefined,
    },
    ...overrides,
  };
}

beforeEach(() => {
  h.preflightRecreate.mockReset();
  h.getAllCoursesAdmin.mockReset();
  h.fetchCourse.mockReset();
  h.diffCourse.mockReset();
  h.getAllCoursesAdmin.mockResolvedValue([{ _id: COURSE_ID }]);
  h.fetchCourse.mockResolvedValue({ creator: { toBase58: () => "AUTH1111" } });
  h.diffCourse.mockReturnValue({
    differences: [
      {
        field: "creator",
        onChainValue: "AUTH1111",
        contentValue: "CREATOR111",
        updateable: false,
      },
      // lesson_count is PRESERVED by the recreate (H3) — must be filtered out.
      {
        field: "lessonCount",
        onChainValue: 3,
        contentValue: 2,
        updateable: false,
      },
      // an updateable diff must never appear as an immutable one.
      {
        field: "xpPerLesson",
        onChainValue: 10,
        contentValue: 25,
        updateable: true,
      },
    ],
  });
});

describe("buildRecreatePreflight — normal creator", () => {
  it("resolves on the first preflight (allow=false) and reports unusualCreator=false", async () => {
    h.preflightRecreate.mockResolvedValueOnce(plan());
    const res = await buildRecreatePreflight(COURSE_ID);
    expect(res.canRecreate).toBe(true);
    if (!res.canRecreate) throw new Error("unreachable");
    expect(res.unusualCreator).toBe(false);
    expect(res.coursePda).toBe("PDA111");
    expect(res.creatorResolved).toBe("CREATOR111");
    expect(res.creatorOnChain).toBe("AUTH1111");
    expect(res.liveLessonCount).toBe(3);
    expect(res.lostCounters).toEqual({
      totalCompletions: 42,
      totalEnrollments: 100,
    });
    // preflight runs exactly ONCE in the common case (no override needed).
    expect(h.preflightRecreate).toHaveBeenCalledTimes(1);
    expect(h.preflightRecreate.mock.calls[0]?.[2]).toBe(false);
  });

  it("filters lessonCount and updateable fields out of immutableDiffs", async () => {
    h.preflightRecreate.mockResolvedValueOnce(plan());
    const res = await buildRecreatePreflight(COURSE_ID);
    if (!res.canRecreate) throw new Error("unreachable");
    expect(res.immutableDiffs.map((d) => d.field)).toEqual(["creator"]);
  });
});

describe("buildRecreatePreflight — F4 unusual creator", () => {
  it("flags unusualCreator when only preflight(allow=true) accepts", async () => {
    h.preflightRecreate
      .mockRejectedValueOnce(
        new RecreateCourseError(
          "creatorWallet equals the platform authority",
          "preflight",
          true
        )
      )
      .mockResolvedValueOnce(plan());
    const res = await buildRecreatePreflight(COURSE_ID);
    expect(res.canRecreate).toBe(true);
    if (!res.canRecreate) throw new Error("unreachable");
    expect(res.unusualCreator).toBe(true);
    // Derived behaviourally: false refused, true accepted → needs the override.
    expect(h.preflightRecreate).toHaveBeenCalledTimes(2);
    expect(h.preflightRecreate.mock.calls[0]?.[2]).toBe(false);
    expect(h.preflightRecreate.mock.calls[1]?.[2]).toBe(true);
  });
});

describe("buildRecreatePreflight — genuine refusal", () => {
  it("returns { canRecreate: false, reason } when even allow=true refuses, using the allow=true message", async () => {
    h.preflightRecreate
      .mockRejectedValueOnce(
        new RecreateCourseError("creator guard", "preflight", true)
      )
      .mockRejectedValueOnce(
        new RecreateCourseError(
          "Prerequisite course is not deployed on-chain",
          "preflight",
          true
        )
      );
    const res = await buildRecreatePreflight(COURSE_ID);
    expect(res.canRecreate).toBe(false);
    if (res.canRecreate) throw new Error("unreachable");
    // The terminal reason is the one that persists under the maximal override,
    // not the (hidden) creator-guard message.
    expect(res.reason).toMatch(/Prerequisite course is not deployed/i);
  });

  it("returns { canRecreate: false } for an ordinary (non-creator) refusal", async () => {
    // Both calls refuse identically (e.g. mainnet / missing fields).
    const err = new RecreateCourseError(
      'Recreate is unavailable on network "mainnet"',
      "preflight",
      true
    );
    h.preflightRecreate.mockRejectedValue(err);
    const res = await buildRecreatePreflight(COURSE_ID);
    expect(res.canRecreate).toBe(false);
    if (res.canRecreate) throw new Error("unreachable");
    expect(res.reason).toMatch(/mainnet/i);
  });
});
