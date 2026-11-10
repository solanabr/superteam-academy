/* eslint-disable import/order -- vi.mock("server-only") must be hoisted above
   the route import so the `server-only` graph loads under vitest. */
// The X handle next to a verified badge is admin-set: only an admin may write
// it, only onto a verified profile, and only as a handle X would issue.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => ({
  AdminAuthError: class AdminAuthError extends Error {},
  state: { authThrows: false },
  list: { data: [] as unknown[], error: null as { message: string } | null },
  update: { data: [] as unknown[], error: null as { message: string } | null },
  calls: [] as { op: string; args: unknown[] }[],
}));

vi.mock("@/lib/admin/auth", () => ({
  AdminAuthError: h.AdminAuthError,
  adminUnauthorizedResponse: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
  requireAdminAuth: vi.fn(() => {
    if (h.state.authThrows) throw new h.AdminAuthError();
    return { userId: "admin-1" };
  }),
}));

/** Records every builder call; resolves as the list read or the update. */
function builder(result: () => { data: unknown[]; error: unknown }) {
  const chain: Record<string, unknown> = {};
  for (const op of ["select", "eq", "is", "order", "update"]) {
    chain[op] = (...args: unknown[]) => {
      h.calls.push({ op, args });
      return chain;
    };
  }
  chain.then = (resolve: (v: unknown) => unknown) => resolve(result());
  return chain;
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => {
      const isUpdate = () => h.calls.some((c) => c.op === "update");
      return builder(() => (isUpdate() ? h.update : h.list));
    },
  }),
}));

import { GET, POST } from "../route";

const AUTHOR_ID = "a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1";

function post(body: unknown): NextRequest {
  return new NextRequest("https://app.test/api/admin/authors", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  h.state.authThrows = false;
  h.list = { data: [], error: null };
  h.update = { data: [{ id: AUTHOR_ID }], error: null };
  h.calls = [];
});

describe("GET /api/admin/authors", () => {
  it("lists verified, non-deleted authors", async () => {
    h.list.data = [
      {
        id: AUTHOR_ID,
        username: "brave-anchor",
        display_name: "Ana Souza",
        verified_kind: "superteam",
        x_username: "ana_dev",
      },
    ];

    const res = await GET(
      new NextRequest("https://app.test/api/admin/authors")
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      authors: [
        {
          id: AUTHOR_ID,
          username: "brave-anchor",
          displayName: "Ana Souza",
          verifiedKind: "superteam",
          xUsername: "ana_dev",
        },
      ],
    });
    expect(h.calls).toContainEqual({ op: "eq", args: ["verified", true] });
    expect(h.calls).toContainEqual({ op: "is", args: ["deleted_at", null] });
  });

  it("401s a non-admin", async () => {
    h.state.authThrows = true;
    const res = await GET(
      new NextRequest("https://app.test/api/admin/authors")
    );
    expect(res.status).toBe(401);
  });
});

describe("POST /api/admin/authors", () => {
  it("normalizes what the admin typed and writes it to a verified profile", async () => {
    const res = await POST(
      post({ userId: AUTHOR_ID, xUsername: "https://x.com/ana_dev" })
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ xUsername: "ana_dev" });
    expect(h.calls).toContainEqual({
      op: "update",
      args: [{ x_username: "ana_dev" }],
    });
    expect(h.calls).toContainEqual({ op: "eq", args: ["id", AUTHOR_ID] });
    expect(h.calls).toContainEqual({ op: "eq", args: ["verified", true] });
  });

  it("clears the handle on an empty value", async () => {
    const res = await POST(post({ userId: AUTHOR_ID, xUsername: "" }));
    expect(res.status).toBe(200);
    expect(h.calls).toContainEqual({
      op: "update",
      args: [{ x_username: null }],
    });
  });

  it("rejects something that isn't a handle, without writing", async () => {
    const res = await POST(
      post({ userId: AUTHOR_ID, xUsername: "https://evil.example/x" })
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "invalidHandle" });
    expect(h.calls.some((c) => c.op === "update")).toBe(false);
  });

  it("rejects a malformed user id", async () => {
    const res = await POST(post({ userId: "1 OR 1=1", xUsername: "ana" }));
    expect(res.status).toBe(400);
    expect(h.calls.some((c) => c.op === "update")).toBe(false);
  });

  it("404s when the profile isn't a verified author", async () => {
    h.update.data = [];
    const res = await POST(post({ userId: AUTHOR_ID, xUsername: "ana" }));
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "notVerified" });
  });

  it("401s a non-admin, without writing", async () => {
    h.state.authThrows = true;
    const res = await POST(post({ userId: AUTHOR_ID, xUsername: "ana" }));
    expect(res.status).toBe(401);
    expect(h.calls).toEqual([]);
  });
});
