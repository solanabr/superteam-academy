/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the route import so the `server-only` graph loads under vitest. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

// `vi.mock` factories are hoisted above the module body, so anything they close
// over must come from `vi.hoisted`.
const h = vi.hoisted(() => ({
  AdminAuthError: class AdminAuthError extends Error {},
  state: { authThrows: false },
  recreateCourse: vi.fn(),
}));

vi.mock("@/lib/admin/auth", () => ({
  // Must be the SAME class object the route's `instanceof` check sees.
  AdminAuthError: h.AdminAuthError,
  adminUnauthorizedResponse: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
  requireAdminAuth: vi.fn(() => {
    if (h.state.authThrows) throw new h.AdminAuthError();
  }),
}));

vi.mock("@/lib/content/queries", () => ({
  getAllCoursesAdmin: async () => [],
  COURSES_CACHE_TAG: "courses",
}));

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

// Keep the REAL RecreateCourseError class (the route branches on `instanceof`);
// stub only the orchestrator so no on-chain call can happen from a route test.
vi.mock("@/lib/admin/recreate-course", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/admin/recreate-course")>();
  return { ...actual, recreateCourse: h.recreateCourse };
});

import { RecreateCourseError } from "@/lib/admin/recreate-course";

const recreateCourse = h.recreateCourse;
const COURSE_ID = "course-solana-101";

const post = async (body: unknown): Promise<Response> => {
  const { POST } = await import("../route");
  return POST(
    new Request("https://app.test/api/admin/courses/recreate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }) as unknown as NextRequest
  );
};

beforeEach(() => {
  h.state.authThrows = false;
  recreateCourse.mockReset();
  recreateCourse.mockResolvedValue({
    action: "recreated",
    coursePda: "PDA111",
    closeSignature: "close-sig",
    createSignature: "create-sig",
    createAttempts: 1,
    lostCounters: { totalCompletions: 42, totalEnrollments: 100 },
    warnings: [],
  });
});

describe("POST /api/admin/courses/recreate — auth", () => {
  it("401s when the admin session is missing, without touching the chain", async () => {
    h.state.authThrows = true;
    const res = await post({ courseId: COURSE_ID, confirm: COURSE_ID });
    expect(res.status).toBe(401);
    expect(recreateCourse).not.toHaveBeenCalled();
  });
});

describe("POST /api/admin/courses/recreate — the confirmation gate", () => {
  it("400s when `confirm` does NOT match courseId, with no on-chain call", async () => {
    const res = await post({ courseId: COURSE_ID, confirm: "course-other" });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/does not match courseId/i);
    // The point of the gate: a stray/CSRF-ish call cannot nuke a course.
    expect(recreateCourse).not.toHaveBeenCalled();
  });

  it("400s when `confirm` is absent entirely", async () => {
    const res = await post({ courseId: COURSE_ID });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/confirm is required/i);
    expect(recreateCourse).not.toHaveBeenCalled();
  });

  it("400s when courseId is absent", async () => {
    const res = await post({ confirm: COURSE_ID });
    expect(res.status).toBe(400);
    expect(recreateCourse).not.toHaveBeenCalled();
  });

  it("400s on an invalid JSON body", async () => {
    const { POST } = await import("../route");
    const res = await POST(
      new Request("https://app.test/api/admin/courses/recreate", {
        method: "POST",
        body: "{not json",
      }) as unknown as NextRequest
    );
    expect(res.status).toBe(400);
    expect(recreateCourse).not.toHaveBeenCalled();
  });

  it("proceeds only when confirm === courseId", async () => {
    const res = await post({ courseId: COURSE_ID, confirm: COURSE_ID });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      action: string;
      lostCounters: { totalCompletions: number };
    };
    expect(body.action).toBe("recreated");
    // The destroyed counters reach the caller so the UI can warn about the loss.
    expect(body.lostCounters.totalCompletions).toBe(42);
    expect(recreateCourse).toHaveBeenCalledWith(COURSE_ID, false);
  });

  it("threads allowUnusualCreator through WHEN it is paired with the acknowledgement gate", async () => {
    await post({
      courseId: COURSE_ID,
      confirm: COURSE_ID,
      allowUnusualCreator: true,
      acknowledgeUnusualCreator: COURSE_ID,
    });
    expect(recreateCourse).toHaveBeenCalledWith(COURSE_ID, true);
  });
});

// ---------------------------------------------------------------------------
// F4 — allowUnusualCreator re-opens the #427/#440 creator-denylist guard, so a
// bare boolean must not be enough: it requires a SEPARATE, explicit
// acknowledgement field that also names the exact course, mirroring the
// `confirm` gate above.
// ---------------------------------------------------------------------------
describe("POST /api/admin/courses/recreate — F4: allowUnusualCreator requires explicit acknowledgement", () => {
  it("400s when allowUnusualCreator=true but acknowledgeUnusualCreator is absent", async () => {
    const res = await post({
      courseId: COURSE_ID,
      confirm: COURSE_ID,
      allowUnusualCreator: true,
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/acknowledgeUnusualCreator/i);
    expect(recreateCourse).not.toHaveBeenCalled();
  });

  it("400s when acknowledgeUnusualCreator does not match courseId", async () => {
    const res = await post({
      courseId: COURSE_ID,
      confirm: COURSE_ID,
      allowUnusualCreator: true,
      acknowledgeUnusualCreator: "course-other",
    });
    expect(res.status).toBe(400);
    expect(recreateCourse).not.toHaveBeenCalled();
  });

  it("ignores an unacknowledged allowUnusualCreator rather than silently honoring it as false-positive-safe — it 400s instead of proceeding with allowUnusualCreator=false", async () => {
    // Sending acknowledgeUnusualCreator equal to a DIFFERENT course's id must
    // not accidentally acknowledge THIS course.
    const res = await post({
      courseId: COURSE_ID,
      confirm: COURSE_ID,
      allowUnusualCreator: true,
      acknowledgeUnusualCreator: "",
    });
    expect(res.status).toBe(400);
    expect(recreateCourse).not.toHaveBeenCalled();
  });

  it("proceeds with allowUnusualCreator=false when it is simply omitted (no acknowledgement needed)", async () => {
    const res = await post({ courseId: COURSE_ID, confirm: COURSE_ID });
    expect(res.status).toBe(200);
    expect(recreateCourse).toHaveBeenCalledWith(COURSE_ID, false);
  });
});

describe("POST /api/admin/courses/recreate — error mapping", () => {
  it("maps a pre-flight refusal to 400 and reports the course as intact", async () => {
    recreateCourse.mockRejectedValue(
      new RecreateCourseError(
        'Course "x" has no creator wallet',
        "preflight",
        true
      )
    );
    const res = await post({ courseId: COURSE_ID, confirm: COURSE_ID });
    expect(res.status).toBe(400);
    const body = (await res.json()) as {
      phase: string;
      courseIntact: boolean;
      error: string;
    };
    expect(body.phase).toBe("preflight");
    expect(body.courseIntact).toBe(true);
  });

  it("maps a pre-flight mainnet refusal to 400 (rail 4)", async () => {
    recreateCourse.mockRejectedValue(
      new RecreateCourseError(
        'Recreate is unavailable on network "mainnet" until Squads custody (#305) lands',
        "preflight",
        true
      )
    );
    const res = await post({ courseId: COURSE_ID, confirm: COURSE_ID });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/Squads custody/i);
  });

  it("maps a post-close create failure to 500, courseIntact:false, with the recovery message", async () => {
    recreateCourse.mockRejectedValue(
      new RecreateCourseError(
        'Course "x" was closed but could NOT be recreated after 4 attempts. The course is currently NOT deployed on-chain; use Deploy to recreate it.',
        "create",
        false
      )
    );
    const res = await post({ courseId: COURSE_ID, confirm: COURSE_ID });
    expect(res.status).toBe(500);
    const body = (await res.json()) as {
      phase: string;
      courseIntact: boolean;
      error: string;
    };
    expect(body.phase).toBe("create");
    // The operator must be told the course is DOWN and exactly how to fix it.
    expect(body.courseIntact).toBe(false);
    expect(body.error).toMatch(
      /currently NOT deployed on-chain; use Deploy to recreate it/i
    );
  });

  it("maps a failed close to 500 but reports the course as intact", async () => {
    recreateCourse.mockRejectedValue(
      new RecreateCourseError(
        "Failed to close: Unauthorized. The course is UNCHANGED and still deployed.",
        "close",
        true
      )
    );
    const res = await post({ courseId: COURSE_ID, confirm: COURSE_ID });
    expect(res.status).toBe(500);
    const body = (await res.json()) as { courseIntact: boolean };
    expect(body.courseIntact).toBe(true);
  });
});
