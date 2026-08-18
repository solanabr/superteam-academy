/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: h.getUser } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: h.rpc }),
}));
vi.mock("@/lib/env.server", () => ({
  serverEnv: { SUPABASE_SERVICE_ROLE_KEY: "service-key" },
}));
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));

import { POST } from "../claim/route";

function req(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/referrals/claim", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
  h.getUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });
  h.rpc.mockResolvedValue({ data: "claimed", error: null });
});

describe("POST /api/referrals/claim", () => {
  it("rejects anonymous callers", async () => {
    h.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await POST(req({ code: "abcd1234" }));
    expect(res.status).toBe(401);
    expect(h.rpc).not.toHaveBeenCalled();
  });

  it("short-circuits a malformed code without touching the DB", async () => {
    const res = await POST(req({ code: "NOT-A-CODE!" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ outcome: "invalidCode" });
    expect(h.rpc).not.toHaveBeenCalled();
  });

  it("claims with the SESSION user id, never a body-supplied one", async () => {
    const res = await POST(
      // A hostile body naming someone else's account must be ignored.
      req({ code: "abcd1234", userId: "victim-2", p_referred_id: "victim-2" })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ outcome: "claimed" });
    expect(h.rpc).toHaveBeenCalledWith("claim_referral", {
      p_referred_id: "user-1",
      p_code: "abcd1234",
    });
  });

  it("relays a terminal outcome verbatim", async () => {
    h.rpc.mockResolvedValue({ data: "claimWindowClosed", error: null });
    const res = await POST(req({ code: "abcd1234" }));
    expect(await res.json()).toEqual({ outcome: "claimWindowClosed" });
  });

  it("500s on an RPC failure so the client keeps the code for a retry", async () => {
    h.rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    const res = await POST(req({ code: "abcd1234" }));
    expect(res.status).toBe(500);
  });
});
