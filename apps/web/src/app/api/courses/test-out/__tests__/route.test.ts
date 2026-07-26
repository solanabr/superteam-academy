/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => {
  class BatchCompleteError extends Error {
    constructor(
      public readonly code: string,
      message: string
    ) {
      super(message);
      this.name = "BatchCompleteError";
    }
  }
  return {
    getUser: vi.fn(),
    isRateLimited: vi.fn(),
    getClientIp: vi.fn(() => "1.2.3.4"),
    releaseRateLimit: vi.fn(async () => {}),
    isPlatformFrozen: vi.fn(async () => false),
    getCourseById: vi.fn(),
    profileSingle: vi.fn(),
    isOnChainProgramLive: vi.fn(async () => true),
    isCourseInMaintenance: vi.fn(async () => false),
    batchCompleteCourse: vi.fn(),
    nextCourseAfter: vi.fn(async () => "course-next"),
    resolveEntryLessonHref: vi.fn(async () => "/en/courses/next/lessons/first"),
    logError: vi.fn(),
    BatchCompleteError,
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: h.getUser } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ single: h.profileSingle }) }),
    }),
  }),
}));
vi.mock("@/lib/rate-limit", () => ({
  isRateLimited: h.isRateLimited,
  getClientIp: h.getClientIp,
  releaseRateLimit: h.releaseRateLimit,
}));
vi.mock("@/lib/solana/academy-program", () => ({
  isOnChainProgramLive: h.isOnChainProgramLive,
}));
vi.mock("@/lib/content/deployments", () => ({
  isCourseInMaintenance: h.isCourseInMaintenance,
}));
vi.mock("@/lib/platform/freeze", () => ({
  isPlatformFrozen: h.isPlatformFrozen,
}));
vi.mock("@/lib/platform/freeze-http", () => ({
  platformFrozenResponse: () => new Response(null, { status: 503 }),
}));
vi.mock("@/lib/content/queries", () => ({ getCourseById: h.getCourseById }));
vi.mock("@/lib/courses/path-order", () => ({
  nextCourseAfter: h.nextCourseAfter,
}));
vi.mock("@/lib/courses/entry-lesson", () => ({
  resolveEntryLessonHref: h.resolveEntryLessonHref,
}));
vi.mock("@/lib/lessons/batch-complete", () => ({
  batchCompleteCourse: h.batchCompleteCourse,
  BatchCompleteError: h.BatchCompleteError,
}));
vi.mock("@/lib/logging", () => ({ logError: h.logError }));

import { GET, POST } from "../route";

const COURSE_ID = "course-x";
// A valid base58 pubkey (System Program) so `new PublicKey(...)` succeeds.
const WALLET = "11111111111111111111111111111111";

function fixtureCourse() {
  const questions = Array.from({ length: 5 }, (_, i) => ({
    id: `q${i}`,
    prompt: `Question ${i}?`,
    multiSelect: false,
    options: [
      { id: "a", label: "Right", correct: true },
      { id: "b", label: "Wrong", correct: false },
    ],
  }));
  return {
    _id: COURSE_ID,
    title: "Fundamentals",
    modules: [
      {
        key: "m1",
        title: "Module",
        lessons: [
          {
            _id: "lesson-1",
            title: "L",
            slug: "l",
            blocks: [{ _type: "quiz", key: "qb", questions }],
          },
        ],
      },
    ],
  };
}

const uid = (i: number) => `lesson-1::qb::q${i}`;
function selections(rightCount: number): Record<string, string[]> {
  const sel: Record<string, string[]> = {};
  for (let i = 0; i < 5; i++) sel[uid(i)] = [i < rightCount ? "a" : "b"];
  return sel;
}

function postReq(body: unknown) {
  return new NextRequest("http://localhost/api/courses/test-out", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost";
  h.getUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });
  h.isRateLimited.mockResolvedValue(false);
  h.getClientIp.mockReturnValue("1.2.3.4");
  h.releaseRateLimit.mockResolvedValue(undefined);
  h.isPlatformFrozen.mockResolvedValue(false);
  h.isOnChainProgramLive.mockResolvedValue(true);
  h.isCourseInMaintenance.mockResolvedValue(false);
  h.nextCourseAfter.mockResolvedValue("course-next");
  h.resolveEntryLessonHref.mockResolvedValue("/en/courses/next/lessons/first");
  h.getCourseById.mockResolvedValue(fixtureCourse());
  h.profileSingle.mockResolvedValue({ data: { wallet_address: WALLET } });
  h.batchCompleteCourse.mockResolvedValue({
    total: 5,
    newlyCompleted: 5,
    alreadyComplete: 0,
    pending: 0,
  });
});

vi.mock("@/lib/env.server", () => ({
  serverEnv: { SUPABASE_SERVICE_ROLE_KEY: "svc" },
}));

describe("GET /api/courses/test-out", () => {
  it("returns the challenge questions with the answer key stripped", async () => {
    const req = new NextRequest(
      `http://localhost/api/courses/test-out?courseId=${COURSE_ID}`
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBe(5);
    expect(body.passRatio).toBeCloseTo(0.8);
    expect(body.questions).toHaveLength(5);
    // No `correct` flag reaches the client.
    expect(JSON.stringify(body.questions)).not.toContain("correct");
  });

  it("401s without a session", async () => {
    h.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const req = new NextRequest(
      `http://localhost/api/courses/test-out?courseId=${COURSE_ID}`
    );
    expect((await GET(req)).status).toBe(401);
  });

  it("404s a course with no quiz pool", async () => {
    h.getCourseById.mockResolvedValue({
      _id: COURSE_ID,
      title: "x",
      modules: [
        {
          key: "m",
          title: "m",
          lessons: [{ _id: "l", title: "l", slug: "l", blocks: [] }],
        },
      ],
    });
    const req = new NextRequest(
      `http://localhost/api/courses/test-out?courseId=${COURSE_ID}`
    );
    expect((await GET(req)).status).toBe(404);
  });
});

describe("POST /api/courses/test-out — grading", () => {
  it("a passing submission batch-completes the course and routes onward", async () => {
    const res = await POST(
      postReq({ courseId: COURSE_ID, selections: selections(5), locale: "en" })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.passed).toBe(true);
    expect(body.next).toBe("/en/courses/next/lessons/first");
    expect(h.batchCompleteCourse).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", courseId: COURSE_ID })
    );
    expect(h.releaseRateLimit).toHaveBeenCalled();
  });

  it("a failing submission changes nothing (no batch completion)", async () => {
    const res = await POST(
      postReq({ courseId: COURSE_ID, selections: selections(3) })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.passed).toBe(false);
    expect(body.correct).toBe(3);
    expect(h.batchCompleteCourse).not.toHaveBeenCalled();
  });

  it("re-grades server-side: a forged client verdict cannot force a pass", async () => {
    // The client claims it passed and sends mostly-wrong answers.
    const res = await POST(
      postReq({ courseId: COURSE_ID, selections: selections(1), passed: true })
    );
    const body = await res.json();
    expect(body.passed).toBe(false);
    expect(h.batchCompleteCourse).not.toHaveBeenCalled();
  });

  it("ignores extraneous client-supplied question ids (uses the derived set)", async () => {
    // All authoritative answers correct, plus a bogus extra id — still a pass,
    // and the bogus id is simply not part of the graded set.
    const sel = { ...selections(5), "forged::uid": ["a"] };
    const res = await POST(postReq({ courseId: COURSE_ID, selections: sel }));
    const body = await res.json();
    expect(body.passed).toBe(true);
    expect(body.total).toBe(5);
  });
});

describe("POST /api/courses/test-out — guards", () => {
  it("429s when the per-user attempt gate trips (before grading)", async () => {
    h.isRateLimited.mockResolvedValueOnce(true); // per-user gate
    const res = await POST(
      postReq({ courseId: COURSE_ID, selections: selections(5) })
    );
    expect(res.status).toBe(429);
    expect(h.batchCompleteCourse).not.toHaveBeenCalled();
  });

  it("503s when the on-chain program is not live", async () => {
    h.isOnChainProgramLive.mockResolvedValue(false);
    const res = await POST(
      postReq({ courseId: COURSE_ID, selections: selections(5) })
    );
    expect(res.status).toBe(503);
    expect(h.batchCompleteCourse).not.toHaveBeenCalled();
  });

  it("400s when no wallet is linked", async () => {
    h.profileSingle.mockResolvedValue({ data: { wallet_address: null } });
    const res = await POST(
      postReq({ courseId: COURSE_ID, selections: selections(5) })
    );
    expect(res.status).toBe(400);
  });

  it("maps enrollment_missing from the batch to a 403", async () => {
    h.batchCompleteCourse.mockRejectedValue(
      new h.BatchCompleteError("enrollment_missing", "no enrollment")
    );
    const res = await POST(
      postReq({ courseId: COURSE_ID, selections: selections(5) })
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.reason).toBe("enrollment_missing");
    // The in-flight lock is still released on the throw path.
    expect(h.releaseRateLimit).toHaveBeenCalled();
  });

  it("maps xp_cap_exceeded from the batch to a 409", async () => {
    h.batchCompleteCourse.mockRejectedValue(
      new h.BatchCompleteError("xp_cap_exceeded", "too much xp")
    );
    const res = await POST(
      postReq({ courseId: COURSE_ID, selections: selections(5) })
    );
    expect(res.status).toBe(409);
  });
});
