import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const getUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));

const SEAL_SECRET = "test-verify-route-seal-secret";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/ai/partner/verify", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  vi.resetModules();
  process.env.AI_PARTNER_SEAL_SECRET = SEAL_SECRET;
  getUser.mockReset();
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
});

afterEach(() => {
  delete process.env.AI_PARTNER_SEAL_SECRET;
  vi.restoreAllMocks();
});

async function sealValidToken(payload: {
  correctIndex: 0 | 1 | 2;
  explanation: string;
}) {
  const { sealCheck } = await import("../../../../lib/ai/check-seal");
  return sealCheck(payload);
}

describe("POST /api/ai/partner/verify", () => {
  it("returns 401 without an authenticated user", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const token = await sealValidToken({ correctIndex: 1, explanation: "e" });

    const { POST } = await import("../partner/verify/route");
    const res = await POST(makeRequest({ checkToken: token, pickedIndex: 1 }));

    expect(res.status).toBe(401);
  });

  it("returns correct:true and the explanation for the correct index", async () => {
    const token = await sealValidToken({
      correctIndex: 1,
      explanation: "B is correct because...",
    });

    const { POST } = await import("../partner/verify/route");
    const res = await POST(makeRequest({ checkToken: token, pickedIndex: 1 }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({
      correct: true,
      explanation: "B is correct because...",
    });
  });

  it("returns correct:false and the explanation for a wrong index", async () => {
    const token = await sealValidToken({
      correctIndex: 1,
      explanation: "B is correct because...",
    });

    const { POST } = await import("../partner/verify/route");
    const res = await POST(makeRequest({ checkToken: token, pickedIndex: 0 }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({
      correct: false,
      explanation: "B is correct because...",
    });
  });

  it("returns 400 for a tampered/garbage token", async () => {
    const { POST } = await import("../partner/verify/route");
    const res = await POST(
      makeRequest({ checkToken: "garbage-not-a-token", pickedIndex: 0 })
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 for a non-integer pickedIndex", async () => {
    const token = await sealValidToken({ correctIndex: 1, explanation: "e" });

    const { POST } = await import("../partner/verify/route");
    const res = await POST(
      makeRequest({ checkToken: token, pickedIndex: 1.5 })
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 for a pickedIndex out of range", async () => {
    const token = await sealValidToken({ correctIndex: 1, explanation: "e" });

    const { POST } = await import("../partner/verify/route");
    const res = await POST(makeRequest({ checkToken: token, pickedIndex: 3 }));

    expect(res.status).toBe(400);
  });

  it("returns 400 on malformed JSON body", async () => {
    const { POST } = await import("../partner/verify/route");
    const res = await POST(makeRequest("{not valid json"));

    expect(res.status).toBe(400);
  });

  it("returns 400 when checkToken is missing", async () => {
    const { POST } = await import("../partner/verify/route");
    const res = await POST(makeRequest({ pickedIndex: 0 }));

    expect(res.status).toBe(400);
  });

  it("returns 413 when checkToken exceeds the max length", async () => {
    const { POST } = await import("../partner/verify/route");
    const res = await POST(
      makeRequest({ checkToken: "x".repeat(1025), pickedIndex: 0 })
    );

    expect([400, 413]).toContain(res.status);
  });
});
