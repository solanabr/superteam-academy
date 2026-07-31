/* eslint-disable import/order -- vi.mock('server-only') must be hoisted. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const rpc = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc }),
}));

const VALID = "11111111-2222-3333-4444-555555555555";

const get = async (url: string): Promise<Response> => {
  const { GET } = await import("../route");
  return GET(new Request(url) as unknown as NextRequest);
};
const post = async (url: string): Promise<Response> => {
  const { POST } = await import("../route");
  return POST(new Request(url, { method: "POST" }) as unknown as NextRequest);
};

beforeEach(() => {
  rpc.mockReset();
  rpc.mockResolvedValue({ data: true, error: null });
});

describe("GET /api/email/unsubscribe (human link)", () => {
  it("unsubscribes a valid token and renders a 200 confirmation page", async () => {
    const res = await get(
      `https://app.test/api/email/unsubscribe?token=${VALID}`
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(rpc).toHaveBeenCalledWith("unsubscribe_by_token", {
      p_token: VALID,
    });
    expect(await res.text()).toContain("unsubscribed");
  });

  it("rejects a non-uuid token WITHOUT touching the DB", async () => {
    const res = await get("https://app.test/api/email/unsubscribe?token=nope");
    expect(res.status).toBe(404);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("404s when the token matches no row", async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    const res = await get(
      `https://app.test/api/email/unsubscribe?token=${VALID}`
    );
    expect(res.status).toBe(404);
  });
});

describe("POST /api/email/unsubscribe (one-click RFC 8058)", () => {
  it("unsubscribes and returns 200 for a valid token", async () => {
    const res = await post(
      `https://app.test/api/email/unsubscribe?token=${VALID}`
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("unsubscribe_by_token", {
      p_token: VALID,
    });
  });

  it("400s a malformed token", async () => {
    const res = await post("https://app.test/api/email/unsubscribe?token=x");
    expect(res.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
});

// #869 — the link is consent-TYPED. Reminder links carry `kind=reminders` and
// must clear ONLY reminder consent; anything else (including every link minted
// before #869, which has no kind at all) stays on the marketing RPC.
describe("consent kind routing", () => {
  it("GET kind=reminders uses the reminder RPC and says so on the page", async () => {
    const res = await get(
      `https://app.test/api/email/unsubscribe?token=${VALID}&kind=reminders`
    );
    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("unsubscribe_reminders_by_token", {
      p_token: VALID,
    });
    expect(rpc).not.toHaveBeenCalledWith("unsubscribe_by_token", {
      p_token: VALID,
    });
    const body = await res.text();
    expect(body).toContain("study-plan reminders");
    expect(body).toContain("product-news preference is unchanged");
  });

  it("POST kind=reminders uses the reminder RPC", async () => {
    const res = await post(
      `https://app.test/api/email/unsubscribe?token=${VALID}&kind=reminders`
    );
    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("unsubscribe_reminders_by_token", {
      p_token: VALID,
    });
  });

  it("a legacy link with NO kind still clears MARKETING consent", async () => {
    await get(`https://app.test/api/email/unsubscribe?token=${VALID}`);
    expect(rpc).toHaveBeenCalledWith("unsubscribe_by_token", {
      p_token: VALID,
    });
  });

  it("an unknown kind falls back to marketing, never to reminders", async () => {
    await get(
      `https://app.test/api/email/unsubscribe?token=${VALID}&kind=everything`
    );
    expect(rpc).toHaveBeenCalledWith("unsubscribe_by_token", {
      p_token: VALID,
    });
  });
});
