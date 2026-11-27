/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => ({
  getUser: vi.fn(),
  createAdminClient: vi.fn(),
  isRateLimited: vi.fn(async () => false),
  isPlatformFrozen: vi.fn(async () => false),
  getCourseById: vi.fn(),
  isCourseTestOutEligible: vi.fn(async () => true),
  batchCompleteCourse: vi.fn(),
  scheduleQuestEvaluation: vi.fn(),
  logEvent: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: h.getUser } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: h.createAdminClient,
}));
vi.mock("@/lib/rate-limit", () => ({
  isRateLimited: h.isRateLimited,
  getClientIp: () => "1.2.3.4",
  releaseRateLimit: vi.fn(async () => {}),
}));
vi.mock("@/lib/solana/academy-program", () => ({
  isOnChainProgramLive: async () => true,
}));
vi.mock("@/lib/content/deployments", () => ({
  isCourseInMaintenance: async () => false,
}));
vi.mock("@/lib/platform/freeze", () => ({
  isPlatformFrozen: h.isPlatformFrozen,
}));
vi.mock("@/lib/platform/freeze-http", () => ({
  platformFrozenResponse: () => new Response(null, { status: 503 }),
}));
vi.mock("@/lib/content/queries", () => ({ getCourseById: h.getCourseById }));
vi.mock("@/lib/courses/path-order", () => ({
  nextCourseAfter: async () => null,
  isCourseTestOutEligible: h.isCourseTestOutEligible,
}));
vi.mock("@/lib/courses/entry-lesson", () => ({
  resolveEntryLessonHref: async () => "/en/dashboard",
}));
vi.mock("@/lib/lessons/batch-complete", () => ({
  batchCompleteCourse: h.batchCompleteCourse,
  BatchCompleteError: class extends Error {},
}));
vi.mock("@/lib/gamification/quest-evaluation", () => ({
  scheduleQuestEvaluation: h.scheduleQuestEvaluation,
}));
vi.mock("@/lib/logging", () => ({
  logError: vi.fn(),
  logEvent: h.logEvent,
}));
vi.mock("@/lib/env.server", () => ({
  serverEnv: { SUPABASE_SERVICE_ROLE_KEY: "svc" },
}));

// `@/lib/courses/test-out` is deliberately not mocked: these tests read the
// shipped switch.
import { GET, POST } from "../route";

const COURSE_ID = "course-x";
const QUESTIONS = 10;

const course = {
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
          blocks: [
            {
              _type: "quiz",
              key: "qb",
              questions: Array.from({ length: QUESTIONS }, (_, i) => ({
                id: `q${i}`,
                prompt: `Question ${i}?`,
                multiSelect: false,
                options: [
                  { id: "a", label: "Right", correct: true },
                  { id: "b", label: "Wrong", correct: false },
                ],
              })),
            },
          ],
        },
      ],
    },
  ],
};

// A signed-in learner with every answer right: the one request the route would
// otherwise grade and complete.
const allCorrect = Object.fromEntries(
  Array.from({ length: QUESTIONS }, (_, i) => [`lesson-1::qb::q${i}`, ["a"]])
);

function expectNothingRan() {
  expect(h.getUser).not.toHaveBeenCalled();
  expect(h.isPlatformFrozen).not.toHaveBeenCalled();
  expect(h.isRateLimited).not.toHaveBeenCalled();
  expect(h.getCourseById).not.toHaveBeenCalled();
  expect(h.isCourseTestOutEligible).not.toHaveBeenCalled();
  expect(h.createAdminClient).not.toHaveBeenCalled();
  expect(h.batchCompleteCourse).not.toHaveBeenCalled();
  expect(h.scheduleQuestEvaluation).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost";
  h.getUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });
  h.getCourseById.mockResolvedValue(course);
  h.createAdminClient.mockReturnValue({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: { wallet_address: "11111111111111111111111111111111" },
          }),
        }),
      }),
    }),
  });
  h.batchCompleteCourse.mockResolvedValue({
    total: 1,
    newlyCompleted: 1,
    alreadyComplete: 0,
    pending: 0,
  });
});

describe("/api/courses/test-out while switched off", () => {
  it("GET refuses before auth or any content read", async () => {
    const res = await GET(
      new NextRequest(
        `http://localhost/api/courses/test-out?courseId=${COURSE_ID}`
      )
    );
    expect(res.status).toBe(403);
    expect((await res.json()).reason).toBe("disabled");
    expectNothingRan();
  });

  it("POST refuses a fully correct submission before grading or writes", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/courses/test-out", {
        method: "POST",
        body: JSON.stringify({ courseId: COURSE_ID, selections: allCorrect }),
        headers: { "content-type": "application/json" },
      })
    );
    expect(res.status).toBe(403);
    expect((await res.json()).reason).toBe("disabled");
    expectNothingRan();
  });

  it("POST refuses without reading the body", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/courses/test-out", {
        method: "POST",
        body: "not json",
      })
    );
    expect(res.status).toBe(403);
    expectNothingRan();
  });
});
