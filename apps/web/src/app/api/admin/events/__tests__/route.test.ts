/* eslint-disable import/order -- vi.mock("server-only") must be hoisted above
   the route import so the `server-only` graph loads under vitest. */
// Only an admin creates events, and every field is checked against what the
// database and the on-chain achievement type will accept.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => ({
  AdminAuthError: class AdminAuthError extends Error {},
  authThrows: false,
  inserted: [] as Record<string, unknown>[],
  insertError: null as { code?: string; message?: string } | null,
}));

vi.mock("@/lib/admin/auth", () => ({
  AdminAuthError: h.AdminAuthError,
  adminUnauthorizedResponse: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
  requireAdminAuth: vi.fn(async () => {
    if (h.authThrows) throw new h.AdminAuthError();
    return { userId: "admin-1" };
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      insert: (row: Record<string, unknown>) => {
        h.inserted.push(row);
        return {
          select: () => ({
            single: async () =>
              h.insertError
                ? { data: null, error: h.insertError }
                : {
                    data: {
                      id: "evt-1",
                      created_at: "2026-11-12T00:00:00.000Z",
                      image_url: null,
                      collection_address: null,
                      deploy_tx: null,
                      deployed_at: null,
                      ...row,
                    },
                    error: null,
                  },
          }),
        };
      },
    }),
  }),
}));

import { POST } from "../route";

const VALID = {
  name: "Breakpoint 2026",
  description: "Opening night workshop",
  xpReward: 100,
  startsAt: "2026-11-20T18:00:00.000Z",
  endsAt: "2026-11-20T22:00:00.000Z",
};

function create(body: unknown): NextRequest {
  return new NextRequest("https://app.test/api/admin/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  h.authThrows = false;
  h.inserted = [];
  h.insertError = null;
});

describe("POST /api/admin/events", () => {
  it("creates an event with a generated code and an event achievement id", async () => {
    const res = await POST(create(VALID));
    expect(res.status).toBe(201);
    const { event } = (await res.json()) as { event: Record<string, unknown> };

    expect(event.code).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    expect(event.achievementId).toMatch(/^event-breakpoint-2026-[a-z0-9]{5}$/);
    expect(h.inserted[0]).toMatchObject({
      name: "Breakpoint 2026",
      xp_reward: 100,
      created_by: "admin-1",
    });
  });

  it("stores a typed code upper-cased", async () => {
    await POST(create({ ...VALID, code: "solana-br" }));
    expect(h.inserted[0]).toMatchObject({ code: "SOLANA-BR" });
  });

  it.each([
    ["an empty name", { name: "  " }, "invalidName"],
    ["a name over 64 bytes", { name: "ç".repeat(33) }, "invalidName"],
    ["zero XP", { xpReward: 0 }, "invalidXp"],
    ["XP above the cap", { xpReward: 501 }, "invalidXp"],
    ["fractional XP", { xpReward: 10.5 }, "invalidXp"],
    [
      "a window that closes first",
      { endsAt: "2026-11-20T17:00:00.000Z" },
      "invalidWindow",
    ],
    ["a bad code", { code: "no spaces!" }, "invalidCode"],
  ])("refuses %s", async (_label, patch, error) => {
    const res = await POST(create({ ...VALID, ...patch }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error });
    expect(h.inserted).toEqual([]);
  });

  it("409s a code another event uses", async () => {
    h.insertError = {
      code: "23505",
      message:
        'duplicate key value violates unique constraint "events_code_key"',
    };
    const res = await POST(create({ ...VALID, code: "TAKEN-1" }));
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({ error: "codeTaken" });
  });

  it("401s a non-admin, without writing", async () => {
    h.authThrows = true;
    expect((await POST(create(VALID))).status).toBe(401);
    expect(h.inserted).toEqual([]);
  });
});
