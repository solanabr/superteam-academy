import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// AI hard-off on the capstone (#867) — the reflection leg.
//
// RULING (implemented here): on the capstone lesson the AI reply is NOT
// generated, while the submission seal is returned exactly as before. The
// capstone credential attests unaided work, and "AI-free" is only checkable if
// it means *no AI turn on that lesson*. Receipt-first (AIE-21) is preserved —
// suppressing enrichment must never make the lesson uncompletable.

vi.mock("server-only", () => ({}));

const getUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));

const getLessonByIdForGrading = vi.fn();
vi.mock("@/lib/content/queries", () => ({ getLessonByIdForGrading }));

const isRateLimited = vi.fn();
const getClientIp = vi.fn(() => "203.0.113.9");
vi.mock("@/lib/rate-limit", () => ({ isRateLimited, getClientIp }));

const maybeGenerateReflectionReply = vi.fn();
vi.mock("@/lib/ai/reflection-reply", () => ({ maybeGenerateReflectionReply }));

import { CAPSTONE_CREDENTIAL } from "@/lib/credentials/capstone-identity";

const BLOCK = {
  _type: "openEnded",
  key: "r1",
  prompt: "What did you build?",
  maxWords: 200,
};

function lessonWithReflection(id: string) {
  return { _id: id, slug: "s", title: "t", blocks: [BLOCK] };
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/lessons/reflect", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const TEXT = "I deployed the vault program to devnet under my own authority.";

beforeEach(() => {
  vi.resetModules();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  process.env.AI_PARTNER_SEAL_SECRET = "test-seal-secret";
  getUser.mockReset();
  getLessonByIdForGrading.mockReset();
  isRateLimited.mockReset();
  maybeGenerateReflectionReply.mockReset();

  getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  isRateLimited.mockResolvedValue(false);
  maybeGenerateReflectionReply.mockResolvedValue("Nice write-up.");
});

describe("POST /api/lessons/reflect — capstone AI-free ruling (#867)", () => {
  it("returns the seal but no AI reply on the capstone lesson", async () => {
    const lessonId = CAPSTONE_CREDENTIAL.deployLessonId;
    getLessonByIdForGrading.mockResolvedValue(lessonWithReflection(lessonId));

    const { POST } = await import("../reflect/route");
    const res = await POST(
      makeRequest({
        courseId: CAPSTONE_CREDENTIAL.courseId,
        lessonId,
        blockKey: "r1",
        text: TEXT,
      })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    // Receipt-first is untouched: completion still works.
    expect(typeof json.seal).toBe("string");
    expect(json.seal.length).toBeGreaterThan(0);
    expect(json.reply).toBeNull();
    // The generator is never even invoked — no spend, no ledger entry.
    expect(maybeGenerateReflectionReply).not.toHaveBeenCalled();
  });

  it("still generates the reply on a non-capstone lesson", async () => {
    getLessonByIdForGrading.mockResolvedValue(
      lessonWithReflection("lesson-ordinary")
    );

    const { POST } = await import("../reflect/route");
    const res = await POST(
      makeRequest({
        courseId: "course-other",
        lessonId: "lesson-ordinary",
        blockKey: "r1",
        text: TEXT,
      })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.reply).toBe("Nice write-up.");
    expect(maybeGenerateReflectionReply).toHaveBeenCalledOnce();
  });
});
