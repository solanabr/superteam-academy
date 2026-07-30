import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// AI hard-off on the capstone (#867, unified spec item 33) — the SERVER leg.
//
// RED-PROOF (measured): with this file's route change reverted, 3 of these 4
// tests fail — `expected 200 to be 403` and `spendAssistTurn … called 1 times`.
// No capstone check exists at main, so the request falls straight through and
// is SERVED, spending a turn and hitting Gemini.
//
// That 200 is the point. Today's capstone happens to carry no `code` block, so
// the route 404s there by accident — the "structural absence" this issue
// exists to replace. The fixtures below deliberately give the capstone a code
// block, which is precisely the content edit that would silently re-enable AI
// on the lesson the credential rests on.

vi.mock("server-only", () => ({}));

const getUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));

const spendAssistTurn = vi.fn();
const refundAssistTurn = vi.fn();
const recordBilledAssist = vi.fn();
const appendAssistLog = vi.fn();
vi.mock("@/lib/ai/assist-budget", () => ({
  spendAssistTurn,
  refundAssistTurn,
  recordBilledAssist,
  appendAssistLog,
  MAX_PAID_ASSISTS: 4,
}));

const isRateLimited = vi.fn();
const getClientIp = vi.fn(() => "203.0.113.9");
vi.mock("@/lib/rate-limit", () => ({ isRateLimited, getClientIp }));

const checkAiSpend = vi.fn();
const recordAiSpend = vi.fn();
vi.mock("@/lib/ai/spend-ledger", () => ({
  checkAiSpend,
  recordAiSpend,
  degradedMaxTokens: (base: number) => Math.max(256, Math.floor(base / 2)),
}));

const getLessonBySlug = vi.fn();
vi.mock("@/lib/content/queries", () => ({ getLessonBySlug }));

// The REAL identity module — deliberately not mocked. These tests must break if
// the constant moves or changes, which is half the point of the shared-constant
// clause.
import {
  CAPSTONE_CREDENTIAL,
  CAPSTONE_AI_OFF_CODE,
} from "@/lib/credentials/capstone-identity";

const CODE_BLOCK = {
  _type: "code",
  key: "c1",
  language: "rust",
  buildType: "standard",
  starter: "fn solve() {}",
  solution: "fn solve() { /* the answer */ }",
  tests: [
    { id: "v1", description: "visible test", input: "1", expectedOutput: "2" },
  ],
  hints: [],
};

// The capstone WITH a code block: the worst case this change defends against —
// a future content edit that gives the capstone a challenge surface. Structural
// absence would silently serve AI here; the constant-driven check must not.
const CAPSTONE_LESSON = {
  _id: CAPSTONE_CREDENTIAL.deployLessonId,
  title: "Capstone",
  slug: "capstone",
  blocks: [{ _type: "prose", key: "p1", src: "Ship it." }, CODE_BLOCK],
};

const ORDINARY_LESSON = {
  _id: "lesson-1",
  title: "Solve it",
  slug: "l-slug",
  blocks: [{ _type: "prose", key: "p1", src: "Double it." }, CODE_BLOCK],
};

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/ai/partner", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const BODY = {
  lessonSlug: "capstone",
  courseSlug: "c-slug",
  action: "hint",
  code: "let x = 1;",
  testSummary: "1/2 passing",
};

const GEMINI_TEXT = JSON.stringify({
  type: "hint",
  text: "Try a smaller step.",
});

function stubGeminiFetch() {
  const fetchMock = vi.fn(async () => {
    return {
      ok: true,
      text: async () => "",
      json: async () => ({
        candidates: [{ content: { parts: [{ text: GEMINI_TEXT }] } }],
        usageMetadata: {},
      }),
    } as unknown as Response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.resetModules();
  process.env.GEMINI_API_KEY = "test-gemini-key";
  process.env.AI_PARTNER_SEAL_SECRET = "test-seal-secret";
  getUser.mockReset();
  spendAssistTurn.mockReset();
  refundAssistTurn.mockReset();
  recordBilledAssist.mockReset();
  appendAssistLog.mockReset();
  isRateLimited.mockReset();
  getLessonBySlug.mockReset();
  checkAiSpend.mockReset();
  recordAiSpend.mockReset();

  getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  isRateLimited.mockResolvedValue(false);
  spendAssistTurn.mockResolvedValue({
    allowed: true,
    tier: "free",
    counts: { free: 1, metered: 0, socratic: 0 },
  });
  refundAssistTurn.mockResolvedValue(undefined);
  recordBilledAssist.mockResolvedValue(undefined);
  appendAssistLog.mockResolvedValue(undefined);
  checkAiSpend.mockResolvedValue({ decision: "full" });
  recordAiSpend.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.GEMINI_API_KEY;
  delete process.env.AI_PARTNER_SEAL_SECRET;
});

describe("POST /api/ai/partner — capstone AI hard-off (#867)", () => {
  it("refuses the capstone lesson with the typed capstone_ai_off code", async () => {
    getLessonBySlug.mockResolvedValue(CAPSTONE_LESSON);
    stubGeminiFetch();

    const { POST } = await import("../partner/route");
    const res = await POST(makeRequest(BODY));
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json).toMatchObject({
      code: CAPSTONE_AI_OFF_CODE,
      capstoneAiOff: true,
    });
  });

  it("spends nothing: no assist turn, no ledger write, no Gemini call", async () => {
    getLessonBySlug.mockResolvedValue(CAPSTONE_LESSON);
    const fetchMock = stubGeminiFetch();

    const { POST } = await import("../partner/route");
    await POST(makeRequest(BODY));

    // The refusal is the design, not a failure — it must cost the learner
    // nothing and must never reach the platform-funded key.
    expect(spendAssistTurn).not.toHaveBeenCalled();
    expect(recordBilledAssist).not.toHaveBeenCalled();
    expect(recordAiSpend).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    // Nothing was spent, so nothing may be refunded either (a refund would
    // credit a turn that was never taken).
    expect(refundAssistTurn).not.toHaveBeenCalled();
  });

  it("refuses every action, not just hint", async () => {
    getLessonBySlug.mockResolvedValue(CAPSTONE_LESSON);
    stubGeminiFetch();
    const { POST } = await import("../partner/route");

    for (const action of ["hint", "ask", "propose", "review"]) {
      const res = await POST(makeRequest({ ...BODY, action }));
      expect(res.status, `action=${action}`).toBe(403);
    }
  });

  it("leaves a non-capstone lesson untouched", async () => {
    getLessonBySlug.mockResolvedValue(ORDINARY_LESSON);
    const fetchMock = stubGeminiFetch();

    const { POST } = await import("../partner/route");
    const res = await POST(
      makeRequest({ ...BODY, lessonSlug: "l-slug", action: "hint" })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toMatchObject({ type: "hint" });
    expect(spendAssistTurn).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalled();
  });
});
