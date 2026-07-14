/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the route import so the `server-only` graph loads under vitest. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => ({
  AdminAuthError: class AdminAuthError extends Error {},
  state: { authThrows: false },
  buildRecreatePreflight: vi.fn(),
}));

vi.mock("@/lib/admin/auth", () => ({
  AdminAuthError: h.AdminAuthError,
  adminUnauthorizedResponse: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
  requireAdminAuth: vi.fn(() => {
    if (h.state.authThrows) throw new h.AdminAuthError();
  }),
}));

// The route delegates the read-only work to the helper; stub it so no on-chain
// read happens in a route test.
vi.mock("@/lib/admin/recreate-preflight", () => ({
  buildRecreatePreflight: h.buildRecreatePreflight,
}));

const buildRecreatePreflight = h.buildRecreatePreflight;
const COURSE_ID = "course-solana-101";

const OK_DTO = {
  canRecreate: true as const,
  courseId: COURSE_ID,
  coursePda: "PDA111",
  creatorOnChain: "AUTH1111",
  creatorResolved: "CREATOR111",
  liveLessonCount: 3,
  unusualCreator: false,
  immutableDiffs: [
    { field: "creator", onChainValue: "AUTH1111", contentValue: "CREATOR111" },
  ],
  lostCounters: { totalCompletions: 42, totalEnrollments: 100 },
};

const get = async (query: string): Promise<Response> => {
  const { GET } = await import("../route");
  return GET(
    new Request(
      `https://app.test/api/admin/courses/recreate/preflight${query}`
    ) as unknown as NextRequest
  );
};

beforeEach(() => {
  h.state.authThrows = false;
  buildRecreatePreflight.mockReset();
  buildRecreatePreflight.mockResolvedValue(OK_DTO);
});

describe("GET /api/admin/courses/recreate/preflight — auth", () => {
  it("401s when the admin session is missing, without doing any preflight work", async () => {
    h.state.authThrows = true;
    const res = await get(`?courseId=${COURSE_ID}`);
    expect(res.status).toBe(401);
    expect(buildRecreatePreflight).not.toHaveBeenCalled();
  });
});

describe("GET /api/admin/courses/recreate/preflight — validation", () => {
  it("400s when courseId is absent", async () => {
    const res = await get("");
    expect(res.status).toBe(400);
    expect(buildRecreatePreflight).not.toHaveBeenCalled();
  });
});

describe("GET /api/admin/courses/recreate/preflight — success DTO", () => {
  it("returns 200 with the full recreate DTO shape", async () => {
    const res = await get(`?courseId=${COURSE_ID}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as typeof OK_DTO;
    expect(body.canRecreate).toBe(true);
    expect(body.coursePda).toBe("PDA111");
    expect(body.creatorResolved).toBe("CREATOR111");
    expect(body.liveLessonCount).toBe(3);
    expect(body.unusualCreator).toBe(false);
    expect(body.immutableDiffs[0]?.field).toBe("creator");
    expect(body.lostCounters.totalCompletions).toBe(42);
    expect(buildRecreatePreflight).toHaveBeenCalledWith(COURSE_ID);
  });
});

describe("GET /api/admin/courses/recreate/preflight — a refusal is data, not a 500", () => {
  it("passes { canRecreate: false, reason } straight through at 200", async () => {
    buildRecreatePreflight.mockResolvedValue({
      canRecreate: false,
      reason:
        'Course "x" has no creator wallet — set course.instructor to an instructor with a wallet',
    });
    const res = await get(`?courseId=${COURSE_ID}`);
    // A refused preflight is expected UI data, never a server error.
    expect(res.status).toBe(200);
    const body = (await res.json()) as { canRecreate: boolean; reason: string };
    expect(body.canRecreate).toBe(false);
    expect(body.reason).toMatch(/no creator wallet/i);
  });
});

describe("GET /api/admin/courses/recreate/preflight — unexpected failure", () => {
  it("500s only when the helper itself throws (RPC/DB), not on a refusal", async () => {
    buildRecreatePreflight.mockRejectedValue(new Error("RPC down"));
    const res = await get(`?courseId=${COURSE_ID}`);
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/RPC down/);
  });
});
