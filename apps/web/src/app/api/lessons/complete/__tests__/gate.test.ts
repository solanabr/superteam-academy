/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { GradeResult } from "@/lib/grading/types";

vi.mock("server-only", () => ({}));

const {
  getUser,
  singleProfile,
  getLessonByIdForGrading,
  getCourseById,
  codeGrader,
  openAttestation,
  isOnChainProgramLive,
  isRateLimited,
} = vi.hoisted(() => ({
  getUser: vi.fn<() => Promise<unknown>>(),
  singleProfile: vi.fn<() => Promise<unknown>>(),
  getLessonByIdForGrading: vi.fn(),
  getCourseById: vi.fn(),
  codeGrader: vi.fn<() => Promise<GradeResult>>(),
  openAttestation: vi.fn<() => boolean>(),
  isOnChainProgramLive: vi.fn<() => Promise<boolean>>(),
  isRateLimited: vi.fn<(ns: string) => Promise<boolean>>(),
}));

vi.mock("@/lib/rate-limit", () => ({
  isRateLimited: (ns: string) => isRateLimited(ns),
  getClientIp: () => "203.0.113.7",
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ single: singleProfile }) }),
    }),
  }),
}));

vi.mock("@/lib/content/queries", () => ({
  getLessonByIdForGrading,
  getCourseById,
}));

// NOTE: `quiz` is intentionally ABSENT from GRADERS — exercises the "graded type
// with no registered grader → 503" fail-closed path.
vi.mock("@/lib/grading/graders", () => ({
  GRADERS: { code: () => codeGrader() },
}));

vi.mock("@/lib/ai/check-seal", () => ({
  openAttestation: () => openAttestation(),
}));

vi.mock("@/lib/solana/academy-program", () => ({
  isOnChainProgramLive,
  completeLesson: vi.fn(),
  getConnection: vi.fn(),
  getProgramId: vi.fn(),
}));
vi.mock("@/lib/solana/academy-reads", () => ({
  fetchEnrollment: vi.fn(),
  fetchCourse: vi.fn(),
}));
vi.mock("@/lib/solana/bitmap", () => ({ isLessonComplete: vi.fn() }));
vi.mock("@/lib/courses/lesson-index", () => ({ findLessonIndex: () => 0 }));
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));

import { POST } from "../route";

function req(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/lessons/complete", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const call = (proofs: Record<string, unknown> = {}) =>
  POST(req({ lessonId: "lesson-1", courseId: "course-1", proofs }));

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "srk";
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  singleProfile.mockResolvedValue({ data: { wallet_address: "wallet-1" } });
  isOnChainProgramLive.mockResolvedValue(false);
  isRateLimited.mockResolvedValue(false);
});

// This route is the chokepoint for every platform-funded on-chain write: the
// backend keypair is payer AND signer, and the LessonCompleted webhook cascades
// from it into finalize_course and issue_credential. The gate below proves
// answers are correct, not that a person produced them — so volume is bounded
// here (#459).
describe("volume gate (#459)", () => {
  const lesson = { blocks: [{ _type: "code", key: "c1" }] };

  it("per-user limit → 429, and grading never runs", async () => {
    getLessonByIdForGrading.mockResolvedValue(lesson);
    isRateLimited.mockImplementation(async (ns) => ns === "lessons:complete");

    const res = await call({ c1: { code: "correct" } });

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("3600");
    // Throttling must short-circuit BEFORE the graders — otherwise a throttled
    // caller still burns a code-executor run per request.
    expect(codeGrader).not.toHaveBeenCalled();
    expect(isOnChainProgramLive).not.toHaveBeenCalled();
  });

  it("per-IP limit → 429 even when the per-user limit is clear", async () => {
    getLessonByIdForGrading.mockResolvedValue(lesson);
    // The per-IP key is the only one that bounds a Sybil farm: every fresh
    // account is a fresh per-user key, so per-user alone would never trip.
    isRateLimited.mockImplementation(
      async (ns) => ns === "lessons:complete:ip"
    );

    const res = await call({ c1: { code: "correct" } });

    expect(res.status).toBe(429);
    expect(codeGrader).not.toHaveBeenCalled();
    expect(isOnChainProgramLive).not.toHaveBeenCalled();
  });

  it("both limits clear → the request proceeds to the completion gate", async () => {
    getLessonByIdForGrading.mockResolvedValue(lesson);
    codeGrader.mockResolvedValue({ ok: false, status: 403 });

    const res = await call({ c1: { code: "wrong" } });

    expect(res.status).toBe(403); // reached grading, not 429
    expect(isRateLimited).toHaveBeenCalledWith("lessons:complete");
    expect(isRateLimited).toHaveBeenCalledWith("lessons:complete:ip");
  });
});

describe("completion gate (block model, fail-closed)", () => {
  it("UNKNOWN block _type → 503 (fail closed) and no on-chain call", async () => {
    getLessonByIdForGrading.mockResolvedValue({
      blocks: [{ _type: "mystery-widget", key: "m1" }],
    });
    const res = await call();
    expect(res.status).toBe(503);
    expect(isOnChainProgramLive).not.toHaveBeenCalled();
  });

  it("graded code block with a WRONG proof → 403 and no on-chain call", async () => {
    getLessonByIdForGrading.mockResolvedValue({
      blocks: [{ _type: "code", key: "c1" }],
    });
    codeGrader.mockResolvedValue({ ok: false, status: 403 });
    const res = await call({ c1: { code: "wrong" } });
    expect(res.status).toBe(403);
    expect(isOnChainProgramLive).not.toHaveBeenCalled();
  });

  it("graded type with NO registered grader → 503 (independent fail-closed path)", async () => {
    getLessonByIdForGrading.mockResolvedValue({
      blocks: [{ _type: "quiz", key: "q1" }], // quiz is graded but absent from GRADERS mock
    });
    const res = await call({ q1: { selections: {} } });
    expect(res.status).toBe(503);
    expect(isOnChainProgramLive).not.toHaveBeenCalled();
  });

  it("executor outage (grader → 503) → 503", async () => {
    getLessonByIdForGrading.mockResolvedValue({
      blocks: [{ _type: "code", key: "c1" }],
    });
    codeGrader.mockResolvedValue({ ok: false, status: 503 });
    const res = await call({ c1: { code: "x" } });
    expect(res.status).toBe(503);
    expect(isOnChainProgramLive).not.toHaveBeenCalled();
  });

  it("required openEnded block with NO attestation → 403", async () => {
    getLessonByIdForGrading.mockResolvedValue({
      blocks: [{ _type: "openEnded", key: "o1" }],
    });
    const res = await call({}); // no proof for o1
    expect(res.status).toBe(403);
    expect(openAttestation).not.toHaveBeenCalled();
    expect(isOnChainProgramLive).not.toHaveBeenCalled();
  });

  it("REPLAYED attestation (verifier rejects wrong user) → 403", async () => {
    getLessonByIdForGrading.mockResolvedValue({
      blocks: [{ _type: "openEnded", key: "o1" }],
    });
    openAttestation.mockReturnValue(false); // sealed for someone else
    const res = await call({ o1: "attestation-for-another-user" });
    expect(res.status).toBe(403);
    expect(openAttestation).toHaveBeenCalled();
    expect(isOnChainProgramLive).not.toHaveBeenCalled();
  });

  it("happy path (graded pass + valid attestation) reaches the on-chain path", async () => {
    getLessonByIdForGrading.mockResolvedValue({
      blocks: [
        { _type: "prose", key: "p1", src: "hi" },
        { _type: "code", key: "c1" },
        { _type: "openEnded", key: "o1" },
      ],
    });
    codeGrader.mockResolvedValue({ ok: true });
    openAttestation.mockReturnValue(true);
    const res = await call({ c1: { code: "ok" }, o1: "valid-token" });
    // Gate passed → the route proceeded to the on-chain liveness check.
    expect(isOnChainProgramLive).toHaveBeenCalled();
    // (program mocked unavailable → 503, but that is AFTER the gate.)
    expect(res.status).toBe(503);
  });
});
