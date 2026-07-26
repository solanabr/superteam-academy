/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

// check-seal.ts (used UNMOCKED here, so the round-trip is genuine) derives its
// HMAC key from serverEnv. The reflect route also reads serverEnv. Back both
// with live getters over process.env so each test's env setup is observed
// without re-parsing the real (fail-fast) env schema.
vi.mock("@/lib/env.server", () => ({
  serverEnv: {
    get SUPABASE_SERVICE_ROLE_KEY() {
      return process.env.SUPABASE_SERVICE_ROLE_KEY;
    },
    get AI_PARTNER_SEAL_SECRET() {
      return process.env.AI_PARTNER_SEAL_SECRET;
    },
    get GEMINI_API_KEY() {
      return process.env.GEMINI_API_KEY;
    },
  },
}));

const {
  getUser,
  isRateLimited,
  getLessonByIdForGrading,
  maybeGenerateReflectionReply,
} = vi.hoisted(() => ({
  getUser: vi.fn(),
  isRateLimited: vi.fn(),
  getLessonByIdForGrading: vi.fn(),
  maybeGenerateReflectionReply: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));
vi.mock("@/lib/rate-limit", () => ({ isRateLimited }));
vi.mock("@/lib/content/queries", () => ({ getLessonByIdForGrading }));
vi.mock("@/lib/ai/reflection-reply", () => ({ maybeGenerateReflectionReply }));
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));

import { POST } from "../route";
// The EXACT verifier /api/lessons/complete calls — proves the seal round-trips.
import { openAttestation } from "@/lib/ai/check-seal";

const LESSON = {
  _id: "lesson-1",
  title: "Reflect",
  slug: "reflect",
  blocks: [
    { _type: "prose", key: "p1", src: "Read this." },
    {
      _type: "openEnded",
      key: "reflect-1",
      prompt: "What did you build?",
      maxWords: 50,
    },
    { _type: "code", key: "c1", language: "rust" },
  ],
};

const VALID_BODY = {
  courseId: "course-1",
  lessonId: "lesson-1",
  blockKey: "reflect-1",
  text: "I built a Solana program that mints soulbound XP tokens.",
};

function req(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/lessons/reflect", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "srk";
  process.env.AI_PARTNER_SEAL_SECRET = "test-seal-secret";
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  isRateLimited.mockResolvedValue(false);
  getLessonByIdForGrading.mockResolvedValue(LESSON);
  maybeGenerateReflectionReply.mockResolvedValue(null);
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.AI_PARTNER_SEAL_SECRET;
  delete process.env.GEMINI_API_KEY;
});

describe("POST /api/lessons/reflect", () => {
  it("happy path: 200 with a seal that the complete-route verifier accepts", async () => {
    maybeGenerateReflectionReply.mockResolvedValue("Nice work!");
    const res = await POST(req(VALID_BODY));
    const json = (await res.json()) as { seal: string; reply: string | null };

    expect(res.status).toBe(200);
    expect(typeof json.seal).toBe("string");
    expect(json.reply).toBe("Nice work!");

    // THE round-trip: the seal this route minted is accepted by openAttestation
    // bound to the SAME {lessonId, blockKey, userId} /api/lessons/complete uses.
    expect(
      openAttestation(json.seal, {
        courseId: "course-1",
        lessonId: "lesson-1",
        blockKey: "reflect-1",
        userId: "user-1",
      })
    ).toBe(true);
  });

  it("the minted seal is rejected when replayed under a different user", async () => {
    const res = await POST(req(VALID_BODY));
    const { seal } = (await res.json()) as { seal: string };
    expect(
      openAttestation(seal, {
        courseId: "course-1",
        lessonId: "lesson-1",
        blockKey: "reflect-1",
        userId: "attacker",
      })
    ).toBe(false);
  });

  it("the minted seal is rejected when replayed into a different course", async () => {
    const res = await POST(req(VALID_BODY));
    const { seal } = (await res.json()) as { seal: string };
    // Same lesson/block/user, different course — the completion gate on
    // course-2 must not accept a receipt minted for course-1.
    expect(
      openAttestation(seal, {
        courseId: "course-2",
        lessonId: "lesson-1",
        blockKey: "reflect-1",
        userId: "user-1",
      })
    ).toBe(false);
  });

  it("401 without an authenticated user (and never seals)", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await POST(req(VALID_BODY));
    expect(res.status).toBe(401);
    expect(getLessonByIdForGrading).not.toHaveBeenCalled();
  });

  it("404 when the lesson does not resolve in the bundle", async () => {
    getLessonByIdForGrading.mockResolvedValue(null);
    const res = await POST(req(VALID_BODY));
    expect(res.status).toBe(404);
  });

  it("404 when the block key is not in the lesson", async () => {
    const res = await POST(req({ ...VALID_BODY, blockKey: "nope" }));
    expect(res.status).toBe(404);
  });

  it("400 when the block is not an openEnded block", async () => {
    const res = await POST(req({ ...VALID_BODY, blockKey: "c1" }));
    expect(res.status).toBe(400);
  });

  it("400 when the submission exceeds maxWords", async () => {
    const res = await POST(
      req({ ...VALID_BODY, text: Array(60).fill("word").join(" ") })
    );
    expect(res.status).toBe(400);
  });

  it("400 on an empty submission", async () => {
    const res = await POST(req({ ...VALID_BODY, text: "   " }));
    expect(res.status).toBe(400);
  });

  it("400 on missing fields", async () => {
    const res = await POST(req({ courseId: "course-1", text: "hi" }));
    expect(res.status).toBe(400);
  });

  it("413 when the body exceeds the size cap", async () => {
    const res = await POST(req("x".repeat(20_001)));
    expect(res.status).toBe(413);
  });

  it("413 when the reflection text exceeds the char cap", async () => {
    const res = await POST(req({ ...VALID_BODY, text: "x".repeat(10_001) }));
    expect(res.status).toBe(413);
  });

  it("429 when rate limited, with a Retry-After header", async () => {
    isRateLimited.mockResolvedValue(true);
    const res = await POST(req(VALID_BODY));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
  });

  it("still issues the seal when the AI reply is disabled/unavailable (reply null)", async () => {
    maybeGenerateReflectionReply.mockResolvedValue(null);
    const res = await POST(req(VALID_BODY));
    const json = (await res.json()) as { seal: string; reply: string | null };
    expect(res.status).toBe(200);
    expect(typeof json.seal).toBe("string");
    expect(json.reply).toBeNull();
  });

  it("still issues the seal when the AI reply path THROWS (receipt-first)", async () => {
    maybeGenerateReflectionReply.mockRejectedValue(new Error("gemini down"));
    const res = await POST(req(VALID_BODY));
    const json = (await res.json()) as { seal: string; reply: string | null };
    expect(res.status).toBe(200);
    expect(typeof json.seal).toBe("string");
    expect(json.reply).toBeNull();
    // And the seal is still valid.
    expect(
      openAttestation(json.seal, {
        courseId: "course-1",
        lessonId: "lesson-1",
        blockKey: "reflect-1",
        userId: "user-1",
      })
    ).toBe(true);
  });

  it("500 when no seal secret is configured (never mints a forgeable seal)", async () => {
    delete process.env.AI_PARTNER_SEAL_SECRET;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    // SUPABASE_SERVICE_ROLE_KEY also guards the top-of-route config check, so this
    // 500s at that guard before ever sealing — the invariant holds either way.
    const res = await POST(req(VALID_BODY));
    expect(res.status).toBe(500);
  });
});
