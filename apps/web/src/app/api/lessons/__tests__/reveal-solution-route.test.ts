/* eslint-disable import/order -- vi.mock must precede importing the route under test. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => ({
  getUser: vi.fn(),
  getLessonBySlug: vi.fn(),
  scheduleReviewItem: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: h.getUser } }),
}));
vi.mock("@/lib/content/queries", () => ({
  getLessonBySlug: h.getLessonBySlug,
}));
vi.mock("@/lib/review/schedule-review", () => ({
  scheduleReviewItem: h.scheduleReviewItem,
}));

import { POST } from "../reveal-solution/route";

const { getUser, getLessonBySlug, scheduleReviewItem } = h;

const USER = { id: "user-123" };
const LESSON = { _id: "lesson-abc", slug: "first-challenge" };
const VALID_BODY = { courseSlug: "solana-101", lessonSlug: "first-challenge" };

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/lessons/reveal-solution", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  getUser.mockReset();
  getLessonBySlug.mockReset();
  scheduleReviewItem.mockReset();
  getUser.mockResolvedValue({ data: { user: USER }, error: null });
  getLessonBySlug.mockResolvedValue(LESSON);
  scheduleReviewItem.mockResolvedValue(true);
});

describe("POST /api/lessons/reveal-solution", () => {
  it("401s an unauthenticated caller and never touches the review queue", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(401);
    expect(scheduleReviewItem).not.toHaveBeenCalled();
  });

  it("400s an unparseable body", async () => {
    const res = await POST(makeRequest("not json"));
    expect(res.status).toBe(400);
    expect(scheduleReviewItem).not.toHaveBeenCalled();
  });

  it("400s a body missing the lesson slugs", async () => {
    const res = await POST(makeRequest({ courseSlug: "solana-101" }));
    expect(res.status).toBe(400);
    expect(scheduleReviewItem).not.toHaveBeenCalled();
  });

  it("404s an unknown lesson without scheduling anything", async () => {
    getLessonBySlug.mockResolvedValue(null);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(404);
    expect(scheduleReviewItem).not.toHaveBeenCalled();
  });

  it("schedules the review keyed by the session user id and returns scheduled", async () => {
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ scheduled: true });
    // The user id comes from the authenticated session, never the request body,
    // and the item key is the resolved lesson _id (raw id — PDA-seed convention).
    expect(scheduleReviewItem).toHaveBeenCalledWith(USER.id, LESSON._id);
  });

  it("reports scheduled=false (never 500s) when the reschedule does not land", async () => {
    scheduleReviewItem.mockResolvedValue(false);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ scheduled: false });
  });
});
