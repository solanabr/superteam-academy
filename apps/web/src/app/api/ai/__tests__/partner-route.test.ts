import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const getUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));

const spendAssist = vi.fn();
const refundAssist = vi.fn();
const recordBilledAssist = vi.fn();
const appendAssistLog = vi.fn();
vi.mock("@/lib/ai/assist-budget", () => ({
  spendAssist,
  refundAssist,
  recordBilledAssist,
  appendAssistLog,
  MAX_PAID_ASSISTS: 4,
}));

const isRateLimited = vi.fn();
const getClientIp = vi.fn(() => "203.0.113.9");
vi.mock("@/lib/rate-limit", () => ({
  isRateLimited,
  getClientIp,
}));

// #591 spend ledger. checkAiSpend gates the call fail-closed; recordAiSpend
// books the cost. degradedMaxTokens is the real pure helper (halve, floor 256).
const checkAiSpend = vi.fn();
const recordAiSpend = vi.fn();
vi.mock("@/lib/ai/spend-ledger", () => ({
  checkAiSpend,
  recordAiSpend,
  degradedMaxTokens: (base: number) => Math.max(256, Math.floor(base / 2)),
}));

const getLessonBySlug = vi.fn();
vi.mock("@/lib/content/queries", () => ({
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

const PROPOSE_EDITS = [{ search: "let x = 1;", replace: "let x = 2;" }];

const PROPOSE_GEMINI_TEXT = JSON.stringify({
  type: "propose",
  rationale: "This fixes the off-by-one error.",
  edits: PROPOSE_EDITS,
  check: {
    question: "Why does this work?",
    options: ["Because A", "Because B", "Because C"],
    correctIndex: 1,
    explanation: "B is correct because...",
  },
});

function stubGeminiFetch(
  text: string,
  opts: {
    ok?: boolean;
    cachedContentTokenCount?: number;
    finishReason?: string;
  } = {}
) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      return {
        ok: opts.ok ?? true,
        text: async () => "error",
        json: async () => ({
          candidates: [
            {
              finishReason: opts.finishReason,
              content: { parts: [{ text }] },
            },
          ],
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
  recordBilledAssist.mockReset();
  appendAssistLog.mockReset();
  isRateLimited.mockReset();
  getLessonBySlug.mockReset();
  checkAiSpend.mockReset();
  recordAiSpend.mockReset();

  // Happy-path defaults; individual tests override as needed.
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  isRateLimited.mockResolvedValue(false);
  getLessonBySlug.mockResolvedValue(LESSON);
  spendAssist.mockResolvedValue({ allowed: true, used: 1 });
  refundAssist.mockResolvedValue(undefined);
  recordBilledAssist.mockResolvedValue(undefined);
  appendAssistLog.mockResolvedValue(undefined);
  // Under every spend cap by default → serve at full budget.
  checkAiSpend.mockResolvedValue({ decision: "full" });
  recordAiSpend.mockResolvedValue(undefined);
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
      edits: PROPOSE_EDITS,
      check: {
        question: "Why does this work?",
        options: ["Because A", "Because B", "Because C"],
      },
    });
    // The full-file echo is gone — a propose response carries only edits.
    expect(json).not.toHaveProperty("proposedCode");
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

  it("records a billed assist exactly once on a successful paid call", async () => {
    stubGeminiFetch(PROPOSE_GEMINI_TEXT);

    const { POST } = await import("../partner/route");
    await POST(makeRequest(VALID_BODY));

    expect(recordBilledAssist).toHaveBeenCalledTimes(1);
    expect(recordBilledAssist).toHaveBeenCalledWith("user-1", "lesson-1");
  });

  it("does NOT refund a post-success throw (appendAssistLog throws) — billed", async () => {
    // The outer catch wraps appendAssistLog; a throw AFTER Gemini has billed us
    // must NOT refund (the AIE-10 line-411 correction). The spend is recorded
    // and the assist stays charged even though logging blew up.
    stubGeminiFetch(PROPOSE_GEMINI_TEXT);
    appendAssistLog.mockRejectedValue(new Error("log store down"));

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(500);
    expect(refundAssist).not.toHaveBeenCalled();
    expect(recordBilledAssist).toHaveBeenCalledTimes(1);
  });

  it("persists the AI turn to the assist log on a successful paid call", async () => {
    stubGeminiFetch(PROPOSE_GEMINI_TEXT);

    const { POST } = await import("../partner/route");
    await POST(makeRequest(VALID_BODY));

    expect(appendAssistLog).toHaveBeenCalledTimes(1);
    const [userId, lessonId, entries] = appendAssistLog.mock.calls[0]!;
    expect(userId).toBe("user-1");
    expect(lessonId).toBe("lesson-1");
    // propose carries no user turn — just the AI reply (with the sealed token).
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      role: "ai",
      response: { type: "propose", edits: PROPOSE_EDITS },
    });
  });

  it("does NOT persist to the assist log when the paid call fails", async () => {
    // Gemini errors after spend -> route refunds and 502s; nothing to log.
    stubGeminiFetch("", { ok: false });

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(502);
    expect(refundAssist).toHaveBeenCalledTimes(1);
    expect(appendAssistLog).not.toHaveBeenCalled();
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

  it("does NOT refund an empty candidate text — it was billed (502)", async () => {
    // Gemini returned a 200 (billed) but no visible output. The tokens are
    // spent, so the assist must NOT be handed back, and the spend is recorded.
    stubGeminiFetch("");

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(502);
    expect(refundAssist).not.toHaveBeenCalled();
    expect(recordBilledAssist).toHaveBeenCalledTimes(1);
    expect(recordBilledAssist).toHaveBeenCalledWith("user-1", "lesson-1");
  });

  it("does NOT refund non-JSON text — it was billed (502)", async () => {
    stubGeminiFetch("not valid json {{{");

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(502);
    expect(refundAssist).not.toHaveBeenCalled();
    expect(recordBilledAssist).toHaveBeenCalledTimes(1);
  });

  it("does NOT refund a MAX_TOKENS-truncated payload — it was billed (502)", async () => {
    // AIE-11: the attacker-triggerable path. A truncated envelope arrives with
    // finishReason "MAX_TOKENS" and cut-off JSON; Gemini billed the full output
    // budget, so refunding it is exactly the hole #590 closes.
    stubGeminiFetch('{"type":"propose","rationale":"the JSON is cut off her', {
      finishReason: "MAX_TOKENS",
    });

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(502);
    expect(refundAssist).not.toHaveBeenCalled();
    expect(recordBilledAssist).toHaveBeenCalledTimes(1);
  });

  it("does NOT refund a malformed propose payload — it was billed (502)", async () => {
    stubGeminiFetch(
      JSON.stringify({ type: "propose", rationale: "only rationale" })
    );

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(502);
    expect(refundAssist).not.toHaveBeenCalled();
    expect(recordBilledAssist).toHaveBeenCalledTimes(1);
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

  it("refunds a PRE-billing throw during prompt building (billed still false)", async () => {
    // The prompt-building block is inside the widened try. A throw there — here
    // the visibleTests map blows up on a malformed code block (tests: null) —
    // happens before any Gemini call, so it is pre-billing: the catch refunds it
    // under `if (!billed)` and records no billed assist.
    getLessonBySlug.mockResolvedValue({
      ...LESSON,
      blocks: [LESSON.blocks[0], { ...LESSON.blocks[1], tests: null }],
    });
    stubGeminiFetch(PROPOSE_GEMINI_TEXT); // never reached

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(500);
    expect(refundAssist).toHaveBeenCalledTimes(1);
    expect(refundAssist).toHaveBeenCalledWith("user-1", "lesson-1");
    expect(recordBilledAssist).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    isRateLimited.mockResolvedValue(true);
    stubGeminiFetch(PROPOSE_GEMINI_TEXT);

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(429);
    expect(spendAssist).not.toHaveBeenCalled();
  });

  it("trips the per-IP ceiling independently of the per-user bucket (429)", async () => {
    // Per-user passes, per-IP ("ai:partner:ip") trips — every fresh account is a
    // fresh per-user bucket, so per-IP is the only dimension that bounds a Sybil
    // actor. The IP ceiling alone must 429 before any spend.
    isRateLimited.mockImplementation(async (namespace: string) => {
      return namespace === "ai:partner:ip";
    });
    stubGeminiFetch(PROPOSE_GEMINI_TEXT);

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(429);
    expect(spendAssist).not.toHaveBeenCalled();
    // Both dimensions were consulted, and BOTH opt into failClosed — a limiter
    // outage must not wave either through unmetered on the platform-funded key.
    const namespaces = isRateLimited.mock.calls.map((c) => c[0]);
    expect(namespaces).toContain("ai:partner");
    expect(namespaces).toContain("ai:partner:ip");
    const userCall = isRateLimited.mock.calls.find(
      (c) => c[0] === "ai:partner"
    )!;
    const ipCall = isRateLimited.mock.calls.find(
      (c) => c[0] === "ai:partner:ip"
    )!;
    expect(userCall[2]).toEqual(expect.objectContaining({ failClosed: true }));
    expect(ipCall[2]).toEqual(expect.objectContaining({ failClosed: true }));
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

  it("returns 413 when code exceeds the 8k cap", async () => {
    const { POST } = await import("../partner/route");
    const res = await POST(
      makeRequest({ ...VALID_BODY, code: "x".repeat(8_001) })
    );

    expect(res.status).toBe(413);
  });

  it("accepts code exactly at the 8k boundary", async () => {
    stubGeminiFetch(PROPOSE_GEMINI_TEXT);

    const { POST } = await import("../partner/route");
    const res = await POST(
      makeRequest({ ...VALID_BODY, code: "x".repeat(8_000) })
    );

    // At the cap (not over) the request is served, not 413'd.
    expect(res.status).toBe(200);
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

  it("threads authored tutorNotes into the prompt as [TUTOR_NOTES] (#592)", async () => {
    getLessonBySlug.mockResolvedValue({
      ...LESSON,
      blocks: [
        LESSON.blocks[0],
        {
          ...LESSON.blocks[1],
          tutorNotes: [
            "Learners often forget to await the RPC call.",
            "A common mistake is an off-by-one loop bound.",
          ],
        },
      ],
    });
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

    const [, init] = fetchSpy.mock.calls[0]!;
    const prompt = (
      JSON.parse(init.body) as {
        contents: { parts: { text: string }[] }[];
      }
    ).contents[0]!.parts[0]!.text;
    expect(prompt).toContain("[TUTOR_NOTES]");
    expect(prompt).toContain("- Learners often forget to await the RPC call.");
    expect(prompt).toContain("- A common mistake is an off-by-one loop bound.");
  });

  it("omits [TUTOR_NOTES] when the challenge authors none (absent → unchanged)", async () => {
    // The default LESSON code block carries no tutorNotes: the prompt must be
    // exactly today's, with no marker section.
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

    const [, init] = fetchSpy.mock.calls[0]!;
    const prompt = (
      JSON.parse(init.body) as {
        contents: { parts: { text: string }[] }[];
      }
    ).contents[0]!.parts[0]!.text;
    expect(prompt).not.toContain("[TUTOR_NOTES]");
  });

  it("re-bounds an out-of-contract tutorNotes array at runtime (6 bullets, each ≤500 chars)", async () => {
    // The schema caps this at 6 × 500, but a schema-bypassing bundle (hand-edit)
    // must not push unbounded text into the platform-funded prompt. Feed 7 notes,
    // one 900 chars long: the prompt must carry exactly 6 bullets with the long
    // one truncated to 500.
    const longNote = "L".repeat(900);
    getLessonBySlug.mockResolvedValue({
      ...LESSON,
      blocks: [
        LESSON.blocks[0],
        {
          ...LESSON.blocks[1],
          tutorNotes: [
            longNote,
            "note 2",
            "note 3",
            "note 4",
            "note 5",
            "note 6",
            "note 7 must be dropped",
          ],
        },
      ],
    });
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

    const [, init] = fetchSpy.mock.calls[0]!;
    const prompt = (
      JSON.parse(init.body) as {
        contents: { parts: { text: string }[] }[];
      }
    ).contents[0]!.parts[0]!.text;
    const notesSection = prompt.slice(prompt.indexOf("[TUTOR_NOTES]"));
    // Exactly 6 bullets survive (the 7th is sliced off).
    expect(notesSection.match(/^- /gm)).toHaveLength(6);
    expect(notesSection).not.toContain("note 7 must be dropped");
    // The long note is truncated to 500 chars (bullet = "- " + 500 L's).
    expect(notesSection).toContain(`- ${"L".repeat(500)}\n`);
    expect(notesSection).not.toContain("L".repeat(501));
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

  it("caps propose output at 2048 tokens and asks for edits, not the whole file", async () => {
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

    const [, init] = fetchSpy.mock.calls[0]!;
    const sent = JSON.parse(init.body) as {
      contents: { parts: { text: string }[] }[];
      generationConfig: {
        maxOutputTokens: number;
        responseSchema: {
          properties: Record<string, unknown>;
          required: string[];
        };
      };
    };
    // Output budget dropped 8192 -> 2048 (AIE-15; closes AIE-11's inflation lever).
    expect(sent.generationConfig.maxOutputTokens).toBe(2048);
    // The propose schema requests an `edits` array and NO whole-file field.
    const schema = sent.generationConfig.responseSchema;
    expect(schema.properties).toHaveProperty("edits");
    expect(schema.properties).not.toHaveProperty("proposedCode");
    expect(schema.required).toContain("edits");
    // The persona no longer instructs a full-file echo.
    const prompt = sent.contents[0]!.parts[0]!.text;
    expect(prompt).not.toContain("the full updated file");
    expect(prompt).toContain("search");
  });

  it("returns 502 on a propose payload with an empty edits array", async () => {
    stubGeminiFetch(
      JSON.stringify({
        type: "propose",
        rationale: "r",
        edits: [],
        check: {
          question: "q",
          options: ["a", "b", "c"],
          correctIndex: 0,
          explanation: "e",
        },
      })
    );

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(502);
    expect(refundAssist).not.toHaveBeenCalled();
    expect(recordBilledAssist).toHaveBeenCalledTimes(1);
  });

  it("returns 502 when a propose edit has an empty search snippet", async () => {
    stubGeminiFetch(
      JSON.stringify({
        type: "propose",
        rationale: "r",
        edits: [{ search: "", replace: "x" }],
        check: {
          question: "q",
          options: ["a", "b", "c"],
          correctIndex: 0,
          explanation: "e",
        },
      })
    );

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(502);
  });

  it("returns 502 when a propose response carries more than the edit ceiling", async () => {
    const tooMany = Array.from({ length: 11 }, (_, i) => ({
      search: `s${i}`,
      replace: `r${i}`,
    }));
    stubGeminiFetch(
      JSON.stringify({
        type: "propose",
        rationale: "r",
        edits: tooMany,
        check: {
          question: "q",
          options: ["a", "b", "c"],
          correctIndex: 0,
          explanation: "e",
        },
      })
    );

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(502);
  });

  // --- LX-C9: post-pass idiomatic review (`review` action) ---

  const REVIEW_BODY = {
    ...VALID_BODY,
    action: "review",
    testSummary: "3/3 passing",
  };

  const REVIEW_GEMINI_TEXT = JSON.stringify({
    type: "review",
    summary: "Your solution passes and reads clearly.",
    notes: [
      "Prefer iter().sum() over the manual loop.",
      "Name `n` for clarity.",
    ],
  });

  it("passes through a well-formed review response for the review action", async () => {
    stubGeminiFetch(REVIEW_GEMINI_TEXT);

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(REVIEW_BODY));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({
      type: "review",
      summary: "Your solution passes and reads clearly.",
      notes: [
        "Prefer iter().sum() over the manual loop.",
        "Name `n` for clarity.",
      ],
    });
  });

  it("accepts a review with an empty notes array (already idiomatic)", async () => {
    stubGeminiFetch(
      JSON.stringify({
        type: "review",
        summary: "Already idiomatic — nothing to change.",
        notes: [],
      })
    );

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(REVIEW_BODY));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({
      type: "review",
      summary: "Already idiomatic — nothing to change.",
      notes: [],
    });
  });

  it("is a metered paid action: spends once, records billed once, no refund (billed-path)", async () => {
    stubGeminiFetch(REVIEW_GEMINI_TEXT);

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(REVIEW_BODY));

    expect(res.status).toBe(200);
    // The review rides the same billed, fail-closed, assist-metered path as
    // every other action — never an unmetered generation.
    expect(spendAssist).toHaveBeenCalledTimes(1);
    expect(spendAssist).toHaveBeenCalledWith("user-1", "lesson-1");
    expect(recordBilledAssist).toHaveBeenCalledTimes(1);
    expect(refundAssist).not.toHaveBeenCalled();
  });

  it("returns budgetExhausted for review when the assist budget is spent", async () => {
    spendAssist.mockResolvedValue({ allowed: false, used: 4 });
    stubGeminiFetch(REVIEW_GEMINI_TEXT);

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(REVIEW_BODY));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toMatchObject({ budgetExhausted: true, used: 4 });
  });

  it("caps review output below propose and uses the summary+notes schema", async () => {
    const fetchSpy = vi.fn(async (_url: string, init: { body: string }) => {
      void init;
      return {
        ok: true,
        text: async () => "",
        json: async () => ({
          candidates: [{ content: { parts: [{ text: REVIEW_GEMINI_TEXT }] } }],
          usageMetadata: { cachedContentTokenCount: 0 },
        }),
      };
    });
    vi.stubGlobal("fetch", fetchSpy);

    const { POST } = await import("../partner/route");
    await POST(makeRequest(REVIEW_BODY));

    const [, init] = fetchSpy.mock.calls[0]!;
    const sent = JSON.parse(init.body) as {
      contents: { parts: { text: string }[] }[];
      generationConfig: {
        maxOutputTokens: number;
        responseSchema: { properties: Record<string, unknown> };
      };
    };
    expect(sent.generationConfig.maxOutputTokens).toBe(1536);
    const schema = sent.generationConfig.responseSchema;
    expect(schema.properties).toHaveProperty("summary");
    expect(schema.properties).toHaveProperty("notes");
    expect(schema.properties).not.toHaveProperty("edits");
    // The post-pass instruction block reaches the model only for review.
    const prompt = sent.contents[0]!.parts[0]!.text;
    expect(prompt).toContain("[REVIEW_INSTRUCTIONS]");
  });

  it("returns 502 on a review payload missing summary — billed, not refunded", async () => {
    stubGeminiFetch(JSON.stringify({ type: "review", notes: ["a note"] }));

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(REVIEW_BODY));

    expect(res.status).toBe(502);
    expect(refundAssist).not.toHaveBeenCalled();
    expect(recordBilledAssist).toHaveBeenCalledTimes(1);
  });

  it("returns 502 when a review note is not a non-empty string", async () => {
    stubGeminiFetch(
      JSON.stringify({ type: "review", summary: "s", notes: ["ok", ""] })
    );

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(REVIEW_BODY));

    expect(res.status).toBe(502);
  });

  it("re-bounds an over-long review notes list to the ceiling", async () => {
    const eight = Array.from({ length: 8 }, (_, i) => `note ${i}`);
    stubGeminiFetch(
      JSON.stringify({ type: "review", summary: "s", notes: eight })
    );

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(REVIEW_BODY));
    const json = await res.json();

    expect(res.status).toBe(200);
    // Six-note ceiling (MAX_REVIEW_NOTES) enforced at the money surface.
    expect(json.notes).toHaveLength(6);
    expect(json.notes).not.toContain("note 6");
  });

  it("persists the review turn to the assist log with no user turn", async () => {
    stubGeminiFetch(REVIEW_GEMINI_TEXT);

    const { POST } = await import("../partner/route");
    await POST(makeRequest(REVIEW_BODY));

    expect(appendAssistLog).toHaveBeenCalledTimes(1);
    const [, , entries] = appendAssistLog.mock.calls[0]!;
    // review carries no user message — only the AI reply.
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      role: "ai",
      response: { type: "review" },
    });
  });

  // --- #591: daily spend ledger gate (per-account / per-IP / global) ---

  it("checks the spend ledger with the user id and client IP before spending", async () => {
    stubGeminiFetch(PROPOSE_GEMINI_TEXT);

    const { POST } = await import("../partner/route");
    await POST(makeRequest(VALID_BODY));

    expect(checkAiSpend).toHaveBeenCalledTimes(1);
    expect(checkAiSpend).toHaveBeenCalledWith("user-1", "203.0.113.9");
  });

  it("under cap: serves at the FULL output budget and records the spend", async () => {
    checkAiSpend.mockResolvedValue({ decision: "full" });
    const fetchSpy = vi.fn(async (_url: string, init: { body: string }) => {
      void init;
      return {
        ok: true,
        text: async () => "",
        json: async () => ({
          candidates: [{ content: { parts: [{ text: PROPOSE_GEMINI_TEXT }] } }],
          usageMetadata: {
            promptTokenCount: 1000,
            candidatesTokenCount: 500,
            thoughtsTokenCount: 0,
          },
        }),
      };
    });
    vi.stubGlobal("fetch", fetchSpy);

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(200);
    // Full budget: propose stays at 2048, not the degraded 1024.
    const [, init] = fetchSpy.mock.calls[0]!;
    const sent = JSON.parse(init.body) as {
      generationConfig: { maxOutputTokens: number };
    };
    expect(sent.generationConfig.maxOutputTokens).toBe(2048);
    // The actual usage is booked against the ledger with the request's IP.
    expect(recordAiSpend).toHaveBeenCalledTimes(1);
    expect(recordAiSpend).toHaveBeenCalledWith("user-1", "203.0.113.9", {
      promptTokenCount: 1000,
      candidatesTokenCount: 500,
      thoughtsTokenCount: 0,
    });
  });

  it("soft cap: DEGRADES to a shorter output budget but still serves (200)", async () => {
    checkAiSpend.mockResolvedValue({ decision: "degraded" });
    const fetchSpy = vi.fn(async (_url: string, init: { body: string }) => {
      void init;
      return {
        ok: true,
        text: async () => "",
        json: async () => ({
          candidates: [{ content: { parts: [{ text: PROPOSE_GEMINI_TEXT }] } }],
          usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 10 },
        }),
      };
    });
    vi.stubGlobal("fetch", fetchSpy);

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(200);
    // Degrade first: propose output budget halved 2048 -> 1024 before any refusal.
    const [, init] = fetchSpy.mock.calls[0]!;
    const sent = JSON.parse(init.body) as {
      generationConfig: { maxOutputTokens: number };
    };
    expect(sent.generationConfig.maxOutputTokens).toBe(1024);
    // A degraded call is still a real paid, billed, booked call.
    expect(spendAssist).toHaveBeenCalledTimes(1);
    expect(recordAiSpend).toHaveBeenCalledTimes(1);
  });

  it("hard cap: DENIES with 503 + spendCapped, spends no assist, calls no model", async () => {
    checkAiSpend.mockResolvedValue({
      decision: "denied",
      reason: "spend_cap",
    });
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json).toMatchObject({ spendCapped: true, reason: "spend_cap" });
    // No assist burned, no model call, no spend recorded — the gate is before spend.
    expect(spendAssist).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(recordAiSpend).not.toHaveBeenCalled();
  });

  it("ledger unreachable: FAILS CLOSED with 503, never serving unmetered", async () => {
    // checkAiSpend returns "denied" on any ledger error (fail-closed contract).
    checkAiSpend.mockResolvedValue({
      decision: "denied",
      reason: "ledger_unavailable",
    });
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));
    const json = await res.json();

    expect(res.status).toBe(503);
    expect(json).toMatchObject({
      spendCapped: true,
      reason: "ledger_unavailable",
    });
    expect(spendAssist).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not leak the solution in a hard-cap 503 body", async () => {
    checkAiSpend.mockResolvedValue({
      decision: "denied",
      reason: "spend_cap",
    });
    vi.stubGlobal("fetch", vi.fn());

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(VALID_BODY));
    const json = await res.json();

    expect(JSON.stringify(json)).not.toContain("the answer");
  });
});
