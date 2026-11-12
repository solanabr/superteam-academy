/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
// Redeeming a code records attendance and queues the on-chain award, but only
// for the signed-in learner, only while the code is live, only once, and only
// for an event whose badge is deployed.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({
  getUser: vi.fn(),
  rateLimited: vi.fn(),
  event: null as Record<string, unknown> | null,
  attendInsert: vi.fn(),
  attendDelete: vi.fn(),
  queueUpsert: vi.fn(),
  wallet: "Wa11et" as string | null,
  drain: vi.fn(),
  after: vi.fn(),
}));

vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: h.after,
}));
vi.mock("@/lib/env.server", () => ({
  serverEnv: { SUPABASE_SERVICE_ROLE_KEY: "svc" },
}));
vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_SUPABASE_URL: "https://proj.supabase.co" },
}));
vi.mock("@/lib/metadata/site-origin", () => ({
  siteOrigin: () => "https://app.test",
  siteUrl: (path: string, origin: string) => `${origin}${path}`,
}));
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  isRateLimited: h.rateLimited,
  getClientIp: () => "203.0.113.1",
}));
vi.mock("@/lib/solana/onchain-queue", () => ({
  retryPendingOnchainActions: h.drain,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: h.getUser } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "events") {
        return {
          select: () => ({
            eq: (_col: string, code: string) => ({
              maybeSingle: async () => ({
                data: h.event && h.event.code === code ? h.event : null,
              }),
            }),
          }),
        };
      }
      if (table === "event_attendances") {
        return {
          insert: (row: unknown) => h.attendInsert(row),
          delete: () => ({
            eq: () => ({ eq: () => h.attendDelete() }),
          }),
        };
      }
      if (table === "pending_onchain_actions") {
        return { upsert: (row: unknown) => h.queueUpsert(row) };
      }
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: { wallet_address: h.wallet },
            }),
          }),
        }),
      };
    },
  }),
}));

import { POST } from "../route";

const HOUR = 3_600_000;

function liveEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt-1",
    achievement_id: "event-breakpoint-ab12c",
    name: "Breakpoint",
    description: "Opening night",
    image_url: null,
    xp_reward: 100,
    code: "ABCD-1234",
    starts_at: new Date(Date.now() - HOUR).toISOString(),
    ends_at: new Date(Date.now() + HOUR).toISOString(),
    collection_address: "Co11ection",
    ...overrides,
  };
}

function redeem(code: unknown): NextRequest {
  return new NextRequest("https://app.test/api/events/redeem", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
  h.getUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });
  h.rateLimited.mockResolvedValue(false);
  h.event = liveEvent();
  h.attendInsert.mockResolvedValue({ error: null });
  h.attendDelete.mockResolvedValue({ error: null });
  h.queueUpsert.mockResolvedValue({ error: null });
  h.wallet = "Wa11et";
});

describe("POST /api/events/redeem", () => {
  it("records attendance for the session's learner and queues the award", async () => {
    const res = await POST(redeem(" abcd-1234 "));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      walletLinked: true,
      event: {
        achievementId: "event-breakpoint-ab12c",
        name: "Breakpoint",
        xpReward: 100,
        imageUrl: "https://app.test/api/events/image/event-breakpoint-ab12c",
      },
    });
    expect(h.attendInsert).toHaveBeenCalledWith({
      event_id: "evt-1",
      user_id: "user-1",
    });
    expect(h.queueUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        action_type: "achievement",
        reference_id: "event-breakpoint-ab12c",
      })
    );
    expect(h.after).toHaveBeenCalledOnce();
  });

  it("reports a missing wallet without refusing the code", async () => {
    h.wallet = null;
    const res = await POST(redeem("ABCD-1234"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ walletLinked: false });
    expect(h.queueUpsert).toHaveBeenCalled();
  });

  it("401s without a session", async () => {
    h.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect((await POST(redeem("ABCD-1234"))).status).toBe(401);
    expect(h.attendInsert).not.toHaveBeenCalled();
  });

  it("429s when rate-limited, before looking at the code", async () => {
    h.rateLimited.mockResolvedValue(true);
    expect((await POST(redeem("ABCD-1234"))).status).toBe(429);
    expect(h.attendInsert).not.toHaveBeenCalled();
  });

  it.each([
    ["an unknown code", "ZZZZ-9999", {}, 404, "invalidCode"],
    ["a malformed code", "x", {}, 400, "invalidCode"],
    [
      "a code before its window",
      "ABCD-1234",
      {
        starts_at: new Date(Date.now() + HOUR).toISOString(),
        ends_at: new Date(Date.now() + 2 * HOUR).toISOString(),
      },
      409,
      "notStarted",
    ],
    [
      "a code after its window",
      "ABCD-1234",
      {
        starts_at: new Date(Date.now() - 2 * HOUR).toISOString(),
        ends_at: new Date(Date.now() - HOUR).toISOString(),
      },
      410,
      "ended",
    ],
    [
      "an event whose badge isn't deployed",
      "ABCD-1234",
      { collection_address: null },
      409,
      "notReady",
    ],
  ])("refuses %s", async (_label, code, overrides, status, error) => {
    h.event = liveEvent(overrides);
    const res = await POST(redeem(code));
    expect(res.status).toBe(status);
    await expect(res.json()).resolves.toMatchObject({ error });
    expect(h.attendInsert).not.toHaveBeenCalled();
    expect(h.queueUpsert).not.toHaveBeenCalled();
  });

  it("refuses a second redemption without queueing again", async () => {
    h.attendInsert.mockResolvedValue({
      error: { code: "23505", message: "dup" },
    });
    const res = await POST(redeem("ABCD-1234"));
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      error: "alreadyRedeemed",
    });
    expect(h.queueUpsert).not.toHaveBeenCalled();
  });

  it("rolls the attendance back when the award can't be queued", async () => {
    h.queueUpsert.mockResolvedValue({ error: { message: "queue down" } });
    const res = await POST(redeem("ABCD-1234"));
    expect(res.status).toBe(500);
    expect(h.attendDelete).toHaveBeenCalledOnce();
  });
});
