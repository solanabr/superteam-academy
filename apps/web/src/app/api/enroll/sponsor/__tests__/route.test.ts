/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => ({
  getUser: vi.fn(),
  single: vi.fn(),
  isRateLimited: vi.fn(),
  isPlatformFrozen: vi.fn(),
  isCourseInMaintenance: vi.fn(),
  getCourseById: vi.fn(),
  buildSponsored: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: h.getUser } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ single: h.single }) }),
    }),
  }),
}));
vi.mock("@/lib/rate-limit", () => ({
  isRateLimited: h.isRateLimited,
  getClientIp: () => "1.2.3.4",
}));
vi.mock("@/lib/platform/freeze", () => ({
  isPlatformFrozen: h.isPlatformFrozen,
}));
vi.mock("@/lib/platform/freeze-http", () => ({
  platformFrozenResponse: () =>
    new Response(JSON.stringify({ error: "frozen" }), { status: 503 }),
}));
vi.mock("@/lib/content/deployments", () => ({
  isCourseInMaintenance: h.isCourseInMaintenance,
}));
vi.mock("@/lib/content/queries", () => ({
  getCourseById: h.getCourseById,
}));
vi.mock("@/lib/solana/sponsor-enroll", () => ({
  buildSponsoredEnrollTransaction: h.buildSponsored,
}));
vi.mock("@/lib/solana/academy-program", () => ({
  describeProgramError: (e: unknown) => String(e),
}));
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));

import { POST } from "../route";

const LEARNER = "3WECquwCtcKVRYNWBPFWE28ag3b1CDKchLZPXxifAJzQ";
const ATTACKER = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";

function post(body: unknown) {
  return new NextRequest("http://localhost/api/enroll/sponsor", {
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
  h.single.mockResolvedValue({ data: { wallet_address: LEARNER } });
  h.isRateLimited.mockResolvedValue(false);
  h.isPlatformFrozen.mockResolvedValue(false);
  h.isCourseInMaintenance.mockResolvedValue(false);
  h.getCourseById.mockResolvedValue({ _id: "course-x" });
  h.buildSponsored.mockResolvedValue({
    transaction: "BASE64TX",
    sponsor: "SponsorPubkey111",
    lastValidBlockHeight: 42,
  });
});

describe("POST /api/enroll/sponsor", () => {
  it("rejects an anonymous caller", async () => {
    h.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await POST(post({ courseId: "course-x" }));
    expect(res.status).toBe(401);
    expect(h.buildSponsored).not.toHaveBeenCalled();
  });

  it("requires a courseId", async () => {
    const res = await POST(post({}));
    expect(res.status).toBe(400);
    expect(h.buildSponsored).not.toHaveBeenCalled();
  });

  it("refuses an unknown course before spending anything", async () => {
    h.getCourseById.mockResolvedValue(undefined);
    const res = await POST(post({ courseId: "nope" }));
    expect(res.status).toBe(404);
    expect(h.buildSponsored).not.toHaveBeenCalled();
  });

  it("refuses when the account has no linked wallet", async () => {
    h.single.mockResolvedValue({ data: { wallet_address: null } });
    const res = await POST(post({ courseId: "course-x" }));
    expect(res.status).toBe(400);
    expect(h.buildSponsored).not.toHaveBeenCalled();
  });

  it("returns the sponsor-signed transaction on the happy path", async () => {
    const res = await POST(post({ courseId: "course-x" }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      success: true,
      transaction: "BASE64TX",
      sponsor: "SponsorPubkey111",
      learner: LEARNER,
    });
  });

  /**
   * The security property this route exists to hold. If the learner came from
   * the request, any signed-in user could make the platform fund enrolments for
   * wallets they do not control — an unbounded drain on the backend signer.
   */
  it("ignores a learner supplied in the body and uses the session's wallet", async () => {
    const res = await POST(post({ courseId: "course-x", learner: ATTACKER }));

    expect(res.status).toBe(200);
    const [, learnerArg] = h.buildSponsored.mock.calls[0]!;
    expect(learnerArg.toBase58()).toBe(LEARNER);
    expect(learnerArg.toBase58()).not.toBe(ATTACKER);
  });

  it("throttles a caller who loops the route", async () => {
    h.isRateLimited.mockResolvedValueOnce(true);
    const res = await POST(post({ courseId: "course-x" }));
    expect(res.status).toBe(429);
    expect(h.buildSponsored).not.toHaveBeenCalled();
  });

  it("declines while the platform is frozen", async () => {
    h.isPlatformFrozen.mockResolvedValue(true);
    const res = await POST(post({ courseId: "course-x" }));
    expect(res.status).toBe(503);
    expect(h.buildSponsored).not.toHaveBeenCalled();
  });
});
