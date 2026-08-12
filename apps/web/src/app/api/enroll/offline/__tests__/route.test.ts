/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => ({
  getUser: vi.fn(),
  upsert: vi.fn(),
  isRateLimited: vi.fn(),
  getCourseById: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: h.getUser } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: () => ({ upsert: h.upsert }) }),
}));
vi.mock("@/lib/rate-limit", () => ({
  isRateLimited: h.isRateLimited,
  getClientIp: () => "1.2.3.4",
}));
vi.mock("@/lib/content/queries", () => ({ getCourseById: h.getCourseById }));
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));

import { POST } from "../route";

/** The single course actually in event mode — see lib/events/offline-course. */
const OFFLINE_COURSE = "course-solana-speedrun";
const NORMAL_COURSE = "course-btc-to-sol-evolution";

function post(body: unknown) {
  return new NextRequest("http://localhost/api/enroll/offline", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  h.getUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });
  h.upsert.mockResolvedValue({ error: null });
  h.isRateLimited.mockResolvedValue(false);
  h.getCourseById.mockReturnValue({ _id: OFFLINE_COURSE });
});

describe("POST /api/enroll/offline", () => {
  /**
   * The property this route lives or dies on. Without the event-mode check it
   * is a general "enrol me with no wallet and no transaction" endpoint, which
   * would bypass the on-chain enrolment every other course depends on — and
   * silently produce learners who can never be finalized or credentialed.
   */
  it("refuses a course that is not in event mode", async () => {
    const res = await POST(post({ courseId: NORMAL_COURSE }));
    expect(res.status).toBe(403);
    expect(h.upsert).not.toHaveBeenCalled();
  });

  it("rejects an anonymous caller", async () => {
    h.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await POST(post({ courseId: OFFLINE_COURSE }));
    expect(res.status).toBe(401);
    expect(h.upsert).not.toHaveBeenCalled();
  });

  it("requires a courseId", async () => {
    const res = await POST(post({}));
    expect(res.status).toBe(400);
    expect(h.upsert).not.toHaveBeenCalled();
  });

  it("refuses an unknown course id", async () => {
    h.getCourseById.mockReturnValue(undefined);
    const res = await POST(post({ courseId: OFFLINE_COURSE }));
    expect(res.status).toBe(404);
    expect(h.upsert).not.toHaveBeenCalled();
  });

  it("enrols the event course with no wallet and no signature", async () => {
    const res = await POST(post({ courseId: OFFLINE_COURSE }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      success: true,
      onChain: false,
    });

    const [row, opts] = h.upsert.mock.calls[0]!;
    expect(row).toMatchObject({
      user_id: "user-1",
      course_id: OFFLINE_COURSE,
      // Both null: a completed row with no signature is precisely what the
      // later on-chain backfill scans for.
      tx_signature: null,
      wallet_address: null,
    });
    // Re-enrolling must not move `enrolled_at` — completed_at is CHECK-
    // constrained to be >= it, so bumping it would make an already-completed
    // row unwritable.
    expect(opts).toMatchObject({ ignoreDuplicates: true });
  });

  it("throttles a caller who loops the route", async () => {
    h.isRateLimited.mockResolvedValueOnce(true);
    const res = await POST(post({ courseId: OFFLINE_COURSE }));
    expect(res.status).toBe(429);
    expect(h.upsert).not.toHaveBeenCalled();
  });
});
