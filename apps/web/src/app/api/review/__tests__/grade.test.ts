/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { GradeResult } from "@/lib/grading/types";
import type { ResolvedReviewItem } from "@/lib/content/queries";

vi.mock("server-only", () => ({}));

const { getUser, resolveReviewItems, gradeQuiz, rpc, maybeSingle } = vi.hoisted(
  () => ({
    getUser: vi.fn<() => Promise<unknown>>(),
    resolveReviewItems: vi.fn<() => Promise<ResolvedReviewItem[]>>(),
    gradeQuiz: vi.fn<() => Promise<GradeResult>>(),
    rpc: vi.fn<() => Promise<{ data: unknown; error: unknown }>>(),
    maybeSingle: vi.fn<() => Promise<{ data: unknown; error: unknown }>>(),
  })
);

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  // The admin client serves the own-row due-read chain AND the grade RPC.
  createAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ eq: () => ({ maybeSingle }) }) }),
    }),
    rpc,
  }),
}));
vi.mock("@/lib/content/queries", () => ({ resolveReviewItems }));
vi.mock("@/lib/grading/graders/quiz", () => ({ gradeQuiz }));
vi.mock("@/lib/env.server", () => ({
  serverEnv: { SUPABASE_SERVICE_ROLE_KEY: "svc" },
}));
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));

import { POST } from "../grade/route";

function req(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/review/grade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const quizItem = (): ResolvedReviewItem => ({
  itemKey: "lesson-pdas",
  lessonTitle: "PDAs",
  lessonSlug: "pdas",
  courseId: "course-1",
  courseSlug: "solana-core",
  skills: ["pdas"],
  quiz: [
    {
      _type: "quiz",
      key: "qb",
      questions: [
        {
          id: "q1",
          prompt: "?",
          options: [{ id: "a", label: "A", correct: true }],
        },
      ],
    },
  ],
});

beforeEach(() => {
  vi.clearAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  resolveReviewItems.mockResolvedValue([quizItem()]);
  gradeQuiz.mockResolvedValue({ ok: true });
  // Default: the learner owns the item and it is due (past due_at).
  maybeSingle.mockResolvedValue({
    data: { due_at: "2000-01-01T00:00:00Z" },
    error: null,
  });
  rpc.mockResolvedValue({
    data: [{ box: 2, due_at: "2026-08-01T00:00:00Z" }],
    error: null,
  });
});

describe("POST /api/review/grade (LX-B5)", () => {
  it("401s an unauthenticated caller and never grades or mutates", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await POST(req({ itemKey: "lesson-pdas", proofs: {} }));
    expect(res.status).toBe(401);
    expect(gradeQuiz).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("400s a missing/oversized itemKey", async () => {
    expect((await POST(req({ proofs: {} }))).status).toBe(400);
    expect(
      (await POST(req({ itemKey: "x".repeat(101), proofs: {} }))).status
    ).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("404s an item that is not an inline-gradable quiz item", async () => {
    resolveReviewItems.mockResolvedValue([{ ...quizItem(), quiz: [] }]);
    const res = await POST(req({ itemKey: "lesson-pdas", proofs: {} }));
    expect(res.status).toBe(404);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("409s a not-yet-due item and NEVER grades or mutates (anti-speed-run)", async () => {
    maybeSingle.mockResolvedValue({
      data: { due_at: "2999-01-01T00:00:00Z" },
      error: null,
    });
    const res = await POST(
      req({
        itemKey: "lesson-pdas",
        proofs: { qb: { selections: { q1: ["a"] } } },
      })
    );
    expect(res.status).toBe(409);
    expect(gradeQuiz).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("404s (and never grades) when the learner has no such review row", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    const res = await POST(
      req({
        itemKey: "lesson-pdas",
        proofs: { qb: { selections: { q1: ["a"] } } },
      })
    );
    expect(res.status).toBe(404);
    expect(gradeQuiz).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("grades a due-now item (due_at in the past passes the gate)", async () => {
    maybeSingle.mockResolvedValue({
      data: { due_at: new Date(Date.now() - 1000).toISOString() },
      error: null,
    });
    const res = await POST(
      req({
        itemKey: "lesson-pdas",
        proofs: { qb: { selections: { q1: ["a"] } } },
      })
    );
    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledOnce();
  });

  it("grades server-side and records a PASS keyed on the session user", async () => {
    const res = await POST(
      req({
        itemKey: "lesson-pdas",
        proofs: { qb: { selections: { q1: ["a"] } } },
      })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      passed: true,
      box: 2,
      dueAt: "2026-08-01T00:00:00Z",
    });
    expect(rpc).toHaveBeenCalledWith("record_review_result", {
      p_user_id: "user-1",
      p_item_key: "lesson-pdas",
      p_passed: true,
    });
  });

  it("records a MISS when the server grader rejects (not client-asserted)", async () => {
    gradeQuiz.mockResolvedValue({ ok: false, status: 403 });
    rpc.mockResolvedValue({
      data: [{ box: 1, due_at: "2026-07-27T00:00:00Z" }],
      error: null,
    });
    const res = await POST(
      // A caller could send a "passed" hint — the route ignores it and re-grades.
      req({ itemKey: "lesson-pdas", proofs: {}, passed: true })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ passed: false, box: 1 });
    expect(rpc).toHaveBeenCalledWith(
      "record_review_result",
      expect.objectContaining({ p_passed: false })
    );
  });

  it("ignores a body-supplied user id — mutation uses the session id only", async () => {
    await POST(
      req({
        itemKey: "lesson-pdas",
        proofs: { qb: { selections: { q1: ["a"] } } },
        userId: "attacker",
        p_user_id: "attacker",
      })
    );
    expect(rpc).toHaveBeenCalledWith(
      "record_review_result",
      expect.objectContaining({ p_user_id: "user-1" })
    );
  });

  it("404s when the RPC returns no row (item is not the caller's own / already cleared)", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    const res = await POST(
      req({
        itemKey: "lesson-pdas",
        proofs: { qb: { selections: { q1: ["a"] } } },
      })
    );
    expect(res.status).toBe(404);
  });

  it("500s on an RPC error", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    const res = await POST(
      req({
        itemKey: "lesson-pdas",
        proofs: { qb: { selections: { q1: ["a"] } } },
      })
    );
    expect(res.status).toBe(500);
  });
});
