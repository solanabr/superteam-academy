import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const getUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));

const spendAssist = vi.fn();
vi.mock("@/lib/ai/assist-budget", () => ({
  spendAssist,
  MAX_PAID_ASSISTS: 4,
}));

const isRateLimited = vi.fn();
vi.mock("@/lib/rate-limit", () => ({
  isRateLimited,
}));

const getChallengeAnswerKey = vi.fn();
const getLessonBySlug = vi.fn();
vi.mock("@/lib/sanity/queries", () => ({
  getChallengeAnswerKey,
  getLessonBySlug,
}));

const GEMINI_API_KEY = "test-gemini-key";

const ANSWER_KEY = {
  _id: "lesson-1",
  type: "challenge",
  language: "rust",
  buildType: null,
  tests: [
    { id: "v1", description: "visible test", input: "1", expectedOutput: "2" },
    {
      id: "h1",
      description: "hidden test",
      input: "10",
      expectedOutput: "20",
      hidden: true,
    },
  ],
  solution: "fn solve() { /* the answer */ }",
};

const LESSON = {
  _id: "lesson-1",
  title: "Solve it",
  slug: "l-slug",
  type: "challenge",
  content: "Implement a function that doubles the input.",
  code: "fn solve() {}",
  tests: [],
  hints: [],
  order: 1,
};

const VALID_BODY = {
  lessonSlug: "l-slug",
  courseSlug: "c-slug",
  action: "propose",
  code: "let x = 1;",
  testSummary: "1/2 passing",
};

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/ai/partner", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const PROPOSE_GEMINI_TEXT = JSON.stringify({
  type: "propose",
  rationale: "This fixes the off-by-one error.",
  proposedCode: "let x = 2;",
  check: {
    question: "Why does this work?",
    options: ["Because A", "Because B", "Because C"],
    correctIndex: 1,
    explanation: "B is correct because...",
  },
});

function stubGeminiFetch(
  text: string,
  opts: { ok?: boolean; cachedContentTokenCount?: number } = {}
) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      return {
        ok: opts.ok ?? true,
        text: async () => "error",
        json: async () => ({
          candidates: [{ content: { parts: [{ text }] } }],
          usageMetadata: {
            cachedContentTokenCount: opts.cachedContentTokenCount ?? 0,
          },
        }),
      } as unknown as Response;
    })
  );
}

beforeEach(() => {
  // The route captures GEMINI_API_KEY as a module-scope const at import time,
  // so each test needs a fresh module evaluation to see the env var state it
  // sets up (some tests delete it to exercise the 503 path).
  vi.resetModules();
  process.env.GEMINI_API_KEY = GEMINI_API_KEY;
  getUser.mockReset();
  spendAssist.mockReset();
  isRateLimited.mockReset();
  getChallengeAnswerKey.mockReset();
  getLessonBySlug.mockReset();

  // Happy-path defaults; individual tests override as needed.
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  isRateLimited.mockResolvedValue(false);
  getChallengeAnswerKey.mockResolvedValue(ANSWER_KEY);
  getLessonBySlug.mockResolvedValue(LESSON);
  spendAssist.mockResolvedValue({ allowed: true, used: 1 });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.GEMINI_API_KEY;
});

describe("POST /api/ai/partner", () => {
  it("returns 401 without an authenticated user", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    stubGeminiFetch(PROPOSE_GEMINI_TEXT);

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(401);
    expect(spendAssist).not.toHaveBeenCalled();
  });

  it("returns 503 when GEMINI_API_KEY is missing", async () => {
    delete process.env.GEMINI_API_KEY;

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(503);
  });

  it("returns budgetExhausted:true as HTTP 200 when spendAssist denies", async () => {
    spendAssist.mockResolvedValue({ allowed: false, used: 4 });
    stubGeminiFetch(PROPOSE_GEMINI_TEXT);

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toMatchObject({ budgetExhausted: true, used: 4 });
  });

  it("passes through a well-formed propose response, validated", async () => {
    stubGeminiFetch(PROPOSE_GEMINI_TEXT);

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toMatchObject({
      type: "propose",
      rationale: "This fixes the off-by-one error.",
      proposedCode: "let x = 2;",
      check: {
        question: "Why does this work?",
        options: ["Because A", "Because B", "Because C"],
        correctIndex: 1,
        explanation: "B is correct because...",
      },
    });
  });

  it("calls spendAssist exactly once on a successful paid call", async () => {
    stubGeminiFetch(PROPOSE_GEMINI_TEXT);

    const { POST } = await import("../partner/route");
    await POST(makeRequest(VALID_BODY));

    expect(spendAssist).toHaveBeenCalledTimes(1);
    expect(spendAssist).toHaveBeenCalledWith("user-1", "lesson-1");
  });

  it("returns 429 when rate limited", async () => {
    isRateLimited.mockResolvedValue(true);
    stubGeminiFetch(PROPOSE_GEMINI_TEXT);

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(429);
    expect(spendAssist).not.toHaveBeenCalled();
  });

  it("returns 400 on malformed JSON body", async () => {
    const { POST } = await import("../partner/route");
    const req = new NextRequest("http://localhost/api/ai/partner", {
      method: "POST",
      body: "{not valid json",
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("returns 413 when code exceeds the cap", async () => {
    const { POST } = await import("../partner/route");
    const res = await POST(
      makeRequest({ ...VALID_BODY, code: "x".repeat(20_001) })
    );

    expect(res.status).toBe(413);
  });

  it("returns 413 when message exceeds the cap", async () => {
    const { POST } = await import("../partner/route");
    const res = await POST(
      makeRequest({
        ...VALID_BODY,
        action: "ask",
        message: "x".repeat(4_001),
      })
    );

    expect(res.status).toBe(413);
  });

  it("returns 404 when the answer key is not found", async () => {
    getChallengeAnswerKey.mockResolvedValue(null);

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(404);
    expect(spendAssist).not.toHaveBeenCalled();
  });

  it("returns 404 when the lesson record is not found", async () => {
    getLessonBySlug.mockResolvedValue(null);

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(404);
    expect(spendAssist).not.toHaveBeenCalled();
  });

  it("never sends hidden tests to Gemini", async () => {
    const fetchSpy = vi.fn(async (_url: string, init: { body: string }) => {
      void init;
      return {
        ok: true,
        text: async () => "",
        json: async () => ({
          candidates: [{ content: { parts: [{ text: PROPOSE_GEMINI_TEXT }] } }],
          usageMetadata: { cachedContentTokenCount: 0 },
        }),
      };
    });
    vi.stubGlobal("fetch", fetchSpy);

    const { POST } = await import("../partner/route");
    await POST(makeRequest(VALID_BODY));

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0]!;
    const sentBody = JSON.stringify(init.body);
    expect(sentBody).not.toContain("hidden test");
    expect(sentBody).not.toContain("20"); // hidden test's expectedOutput
    expect(sentBody).toContain("visible test");
    // The reference solution IS expected in the prompt (by design — the model
    // needs it to ground hints/proposals), so only assert hidden-test leakage.
  });

  it("returns 502 on a malformed (missing required fields) propose payload", async () => {
    stubGeminiFetch(
      JSON.stringify({ type: "propose", rationale: "only rationale" })
    );

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(502);
  });

  it("returns 502 and never leaks the solution when Gemini errors", async () => {
    stubGeminiFetch("", { ok: false });

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));
    const json = await res.json();

    expect(res.status).toBe(502);
    expect(JSON.stringify(json)).not.toContain("the answer");
  });

  it("accepts a well-formed hint response for the hint action", async () => {
    stubGeminiFetch(
      JSON.stringify({ type: "hint", text: "Try checking the loop bound." })
    );

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest({ ...VALID_BODY, action: "hint" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({
      type: "hint",
      text: "Try checking the loop bound.",
    });
  });

  it("accepts a well-formed answer response for the ask action", async () => {
    stubGeminiFetch(
      JSON.stringify({ type: "answer", text: "Here is the explanation." })
    );

    const { POST } = await import("../partner/route");
    const res = await POST(
      makeRequest({ ...VALID_BODY, action: "ask", message: "why?" })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({
      type: "answer",
      text: "Here is the explanation.",
    });
  });
});
