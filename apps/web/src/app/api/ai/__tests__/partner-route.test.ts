import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const getUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));

const spendAssist = vi.fn();
const refundAssist = vi.fn();
vi.mock("@/lib/ai/assist-budget", () => ({
  spendAssist,
  refundAssist,
  MAX_PAID_ASSISTS: 4,
}));

const isRateLimited = vi.fn();
vi.mock("@/lib/rate-limit", () => ({
  isRateLimited,
}));

const getLessonBySlug = vi.fn();
vi.mock("@/lib/sanity/queries", () => ({
  getLessonBySlug,
}));

const GEMINI_API_KEY = "test-gemini-key";

// Post-D4 the AI Partner reads the challenge from the PUBLIC block projection:
// the code block's solution + (all-public) tests, and the prose blocks for the
// task brief. There is no separate answer key.
const LESSON = {
  _id: "lesson-1",
  title: "Solve it",
  slug: "l-slug",
  blocks: [
    {
      _type: "prose",
      key: "p1",
      src: "Implement a function that doubles the input.",
    },
    {
      _type: "code",
      key: "c1",
      language: "rust",
      buildType: "standard",
      starter: "fn solve() {}",
      solution: "fn solve() { /* the answer */ }",
      tests: [
        {
          id: "v1",
          description: "visible test",
          input: "1",
          expectedOutput: "2",
        },
      ],
      hints: [],
    },
  ],
};

const LESSON_NO_CODE = {
  _id: "lesson-2",
  title: "Reading",
  slug: "l2",
  blocks: [{ _type: "prose", key: "p1", src: "Just read." }],
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
  // The propose path seals a check token; deriveKey throws on an all-unset
  // secret chain, so give it one.
  process.env.AI_PARTNER_SEAL_SECRET = "test-seal-secret";
  getUser.mockReset();
  spendAssist.mockReset();
  refundAssist.mockReset();
  isRateLimited.mockReset();
  getLessonBySlug.mockReset();

  // Happy-path defaults; individual tests override as needed.
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  isRateLimited.mockResolvedValue(false);
  getLessonBySlug.mockResolvedValue(LESSON);
  spendAssist.mockResolvedValue({ allowed: true, used: 1 });
  refundAssist.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.GEMINI_API_KEY;
  delete process.env.AI_PARTNER_SEAL_SECRET;
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

  it("passes through a well-formed propose response, sealed and validated", async () => {
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
      },
    });
    expect(typeof json.checkToken).toBe("string");
    expect(json.checkToken.length).toBeGreaterThan(0);
    // The answer must NEVER be in the client-facing JSON — see the
    // dedicated leak-proof test below and the spec's grep check.
    expect(json.check).not.toHaveProperty("correctIndex");
    expect(json.check).not.toHaveProperty("explanation");
    expect(json).not.toHaveProperty("correctIndex");
    expect(json).not.toHaveProperty("explanation");
  });

  it("NEVER includes correctIndex or explanation anywhere in the propose JSON (P0 leak check)", async () => {
    stubGeminiFetch(PROPOSE_GEMINI_TEXT);

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));
    const json = await res.json();

    const serialized = JSON.stringify(json);
    expect(serialized).not.toContain("correctIndex");
    expect(serialized).not.toContain("B is correct because");
  });

  it("calls spendAssist exactly once on a successful paid call", async () => {
    stubGeminiFetch(PROPOSE_GEMINI_TEXT);

    const { POST } = await import("../partner/route");
    await POST(makeRequest(VALID_BODY));

    expect(spendAssist).toHaveBeenCalledTimes(1);
    expect(spendAssist).toHaveBeenCalledWith("user-1", "lesson-1");
  });

  it("does NOT call refundAssist on a successful paid call", async () => {
    stubGeminiFetch(PROPOSE_GEMINI_TEXT);

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(200);
    expect(refundAssist).not.toHaveBeenCalled();
  });

  it("does NOT call refundAssist when the budget is already exhausted (no spend happened)", async () => {
    spendAssist.mockResolvedValue({ allowed: false, used: 4 });
    stubGeminiFetch(PROPOSE_GEMINI_TEXT);

    const { POST } = await import("../partner/route");
    await POST(makeRequest(VALID_BODY));

    expect(refundAssist).not.toHaveBeenCalled();
  });

  it("calls refundAssist when the Gemini fetch itself returns !ok (502)", async () => {
    stubGeminiFetch("", { ok: false });

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(502);
    expect(refundAssist).toHaveBeenCalledTimes(1);
    expect(refundAssist).toHaveBeenCalledWith("user-1", "lesson-1");
  });

  it("calls refundAssist when Gemini returns an empty candidate text (502)", async () => {
    stubGeminiFetch("");

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(502);
    expect(refundAssist).toHaveBeenCalledTimes(1);
    expect(refundAssist).toHaveBeenCalledWith("user-1", "lesson-1");
  });

  it("calls refundAssist when Gemini returns non-JSON text (502)", async () => {
    stubGeminiFetch("not valid json {{{");

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(502);
    expect(refundAssist).toHaveBeenCalledTimes(1);
    expect(refundAssist).toHaveBeenCalledWith("user-1", "lesson-1");
  });

  it("calls refundAssist when Gemini returns a malformed propose payload (502)", async () => {
    stubGeminiFetch(
      JSON.stringify({ type: "propose", rationale: "only rationale" })
    );

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(502);
    expect(refundAssist).toHaveBeenCalledTimes(1);
    expect(refundAssist).toHaveBeenCalledWith("user-1", "lesson-1");
  });

  it("calls refundAssist when an unexpected error is thrown after spend (500)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        throw new Error("boom");
      })
    );

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(500);
    expect(refundAssist).toHaveBeenCalledTimes(1);
    expect(refundAssist).toHaveBeenCalledWith("user-1", "lesson-1");
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

  it("returns 404 when the lesson has no code block", async () => {
    getLessonBySlug.mockResolvedValue(LESSON_NO_CODE);

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

  it("feeds the code block's public tests + solution + prose task to Gemini", async () => {
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
    // Post-D4 every test is public and grounds the model.
    expect(sentBody).toContain("visible test");
    // The prose block is the task brief; the code block's solution grounds hints.
    expect(sentBody).toContain("doubles the input");
    expect(sentBody).toContain("the answer");
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
