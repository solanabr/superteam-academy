/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the route import so the `server-only` graph loads under vitest. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

// The real requireAdminAuth, unlike route.test.ts: only the session lookups and
// the freeze writer are faked, so these cases run the route's actual auth seam.
const h = vi.hoisted(() => ({
  setPlatformFrozen: vi.fn(async () => undefined),
  session: { user: { id: "admin-1" } as { id: string } | null },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: h.session.user },
        error: null,
      }),
    },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { user_id: "admin-1" },
            error: null,
          }),
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/platform/freeze", () => ({
  setPlatformFrozen: h.setPlatformFrozen,
  getPlatformFreezeState: vi.fn(),
}));

const post = async (headers: Record<string, string>): Promise<Response> => {
  const { POST } = await import("../route");
  return POST(
    new Request("https://app.test/api/admin/freeze", {
      method: "POST",
      headers: { "sec-fetch-site": "same-origin", ...headers },
      body: JSON.stringify({ frozen: true }),
    }) as unknown as NextRequest
  );
};

beforeEach(() => {
  h.setPlatformFrozen.mockClear();
  h.session.user = { id: "admin-1" };
});

describe("POST /api/admin/freeze with the real auth check", () => {
  it("runs for an admin sending JSON", async () => {
    const res = await post({ "content-type": "application/json" });
    expect(res.status).toBe(200);
    expect(h.setPlatformFrozen).toHaveBeenCalledWith(true, undefined);
  });

  // fetch() labels a string body text/plain; `curl -d` sends a form type.
  it.each(["text/plain;charset=UTF-8", "application/x-www-form-urlencoded"])(
    "answers an admin's %s with a 415 naming the header, and writes nothing",
    async (contentType) => {
      const res = await post({ "content-type": contentType });
      expect(res.status).toBe(415);
      expect(((await res.json()) as { error: string }).error).toContain(
        "application/json"
      );
      expect(h.setPlatformFrozen).not.toHaveBeenCalled();
    }
  );

  it("answers a non-admin's text/plain with the plain 401", async () => {
    h.session.user = null;
    const res = await post({ "content-type": "text/plain" });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
    expect(h.setPlatformFrozen).not.toHaveBeenCalled();
  });

  it("refuses a cross-site JSON request and writes nothing", async () => {
    const res = await post({
      "content-type": "application/json",
      "sec-fetch-site": "cross-site",
    });
    expect(res.status).toBe(401);
    expect(h.setPlatformFrozen).not.toHaveBeenCalled();
  });
});
