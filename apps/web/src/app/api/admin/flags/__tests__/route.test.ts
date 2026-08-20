/* eslint-disable import/order -- vi.mock("server-only") must be hoisted above
   the route import so the `server-only` graph loads under vitest. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const ADMIN_ID = "admin-user-1";

const h = vi.hoisted(() => ({
  AdminAuthError: class AdminAuthError extends Error {},
  state: { authThrows: false, rateLimited: false },
}));

vi.mock("@/lib/admin/auth", () => ({
  AdminAuthError: h.AdminAuthError,
  adminUnauthorizedResponse: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
  requireAdminAuth: vi.fn(() => {
    if (h.state.authThrows) throw new h.AdminAuthError();
    return { userId: ADMIN_ID };
  }),
}));

const isRateLimited = vi.fn(async () => h.state.rateLimited);
vi.mock("@/lib/rate-limit", () => ({
  isRateLimited: (...args: unknown[]) =>
    (isRateLimited as unknown as (...a: unknown[]) => Promise<boolean>)(
      ...args
    ),
}));

const THREAD_FLAG = {
  id: "flag-thread",
  thread_id: "thread-1",
  answer_id: null,
};
const ANSWER_FLAG = {
  id: "flag-answer",
  thread_id: null,
  answer_id: "answer-1",
};

type Err = { message: string } | null;

interface Recorded {
  rpc: { name: string; args: Record<string, unknown> }[];
}
let rec: Recorded;

const db = {
  // POST flag lookup
  flag: null as Record<string, unknown> | null,
  flagLookupError: null as Err,
  rpcError: null as Err,
  // GET fixtures
  pendingFlags: [] as Record<string, unknown>[],
  answers: [] as Record<string, unknown>[],
  threads: [] as Record<string, unknown>[],
  categories: [] as Record<string, unknown>[],
  profiles: [] as Record<string, unknown>[],
};

const TABLE_ROWS: Record<string, () => Record<string, unknown>[]> = {
  flags: () => db.pendingFlags,
  answers: () => db.answers,
  threads: () => db.threads,
  forum_categories: () => db.categories,
  profiles: () => db.profiles,
};

/**
 * Chainable, thenable query builder. `.maybeSingle()` serves the POST single-row
 * flag lookup; awaiting the chain (`.then`) serves the GET list reads. Every
 * filter returns `this`, so `.eq().eq().maybeSingle()` and `.eq().order().limit()`
 * both work.
 */
class Q implements PromiseLike<{ data: unknown; error: Err }> {
  constructor(private readonly table: string) {}
  eq(): this {
    return this;
  }
  in(): this {
    return this;
  }
  order(): this {
    return this;
  }
  limit(): this {
    return this;
  }
  maybeSingle(): Promise<{ data: unknown; error: Err }> {
    return Promise.resolve({ data: db.flag, error: db.flagLookupError });
  }
  then<R1, R2 = never>(
    onfulfilled?:
      | ((v: { data: unknown; error: Err }) => R1 | PromiseLike<R1>)
      | null,
    onrejected?: ((r: unknown) => R2 | PromiseLike<R2>) | null
  ): PromiseLike<R1 | R2> {
    return Promise.resolve({
      data: TABLE_ROWS[this.table]?.() ?? [],
      error: null,
    }).then(onfulfilled, onrejected);
  }
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => ({ select: () => new Q(table) }),
    rpc: (name: string, args: Record<string, unknown>) => {
      rec.rpc.push({ name, args });
      return Promise.resolve({ data: null, error: db.rpcError });
    },
  }),
}));

const post = async (body: unknown, referer?: string): Promise<Response> => {
  const { POST } = await import("../route");
  return POST(
    new Request("https://app.test/api/admin/flags", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(referer ? { referer } : {}),
      },
      body: JSON.stringify(body),
    }) as unknown as NextRequest
  );
};

const get = async (referer?: string): Promise<Response> => {
  const { GET } = await import("../route");
  return GET(
    new Request("https://app.test/api/admin/flags", {
      headers: referer ? { referer } : {},
    }) as unknown as NextRequest
  );
};

beforeEach(() => {
  h.state.authThrows = false;
  h.state.rateLimited = false;
  isRateLimited.mockClear();
  rec = { rpc: [] };
  db.flag = THREAD_FLAG;
  db.flagLookupError = null;
  db.rpcError = null;
  db.pendingFlags = [];
  db.answers = [];
  db.threads = [];
  db.categories = [];
  db.profiles = [];
});

describe("POST /api/admin/flags — auth and validation", () => {
  it("401s without an admin session and touches nothing", async () => {
    h.state.authThrows = true;

    const res = await post({ flagId: "flag-thread", action: "remove" });

    expect(res.status).toBe(401);
    expect(rec.rpc).toEqual([]);
    expect(isRateLimited).not.toHaveBeenCalled();
  });

  it("400s on an unknown action without touching content", async () => {
    const res = await post({ flagId: "flag-thread", action: "ban" });

    expect(res.status).toBe(400);
    expect(rec.rpc).toEqual([]);
  });

  it("400s when flagId is missing", async () => {
    const res = await post({ action: "remove" });
    expect(res.status).toBe(400);
  });

  it("404s on a flag that is missing or no longer pending", async () => {
    db.flag = null;

    const res = await post({ flagId: "nope", action: "remove" });

    expect(res.status).toBe(404);
    expect(rec.rpc).toEqual([]);
  });

  it("429s when the moderation limiter trips, before any write", async () => {
    h.state.rateLimited = true;

    const res = await post({ flagId: "flag-thread", action: "remove" });

    expect(res.status).toBe(429);
    expect(rec.rpc).toEqual([]);
    expect(isRateLimited).toHaveBeenCalledWith(
      "admin-moderate",
      ADMIN_ID,
      expect.objectContaining({ maxTokens: expect.any(Number) })
    );
  });
});

describe("POST /api/admin/flags — remove (one atomic RPC)", () => {
  it("removes a reported thread through the thread RPC, passing flag + actor", async () => {
    const res = await post({ flagId: "flag-thread", action: "remove" });

    expect(res.status).toBe(200);
    expect(rec.rpc).toEqual([
      {
        name: "moderate_soft_delete_thread",
        args: {
          p_thread_id: "thread-1",
          p_flag_id: "flag-thread",
          p_actor_id: ADMIN_ID,
        },
      },
    ]);
  });

  it("removes a reported answer through the answer RPC", async () => {
    db.flag = ANSWER_FLAG;

    const res = await post({ flagId: "flag-answer", action: "remove" });

    expect(res.status).toBe(200);
    expect(rec.rpc).toEqual([
      {
        name: "moderate_soft_delete_answer",
        args: {
          p_answer_id: "answer-1",
          p_flag_id: "flag-answer",
          p_actor_id: ADMIN_ID,
        },
      },
    ]);
  });

  it("409s when the RPC reports the content already actioned", async () => {
    db.rpcError = { message: "Thread not found or already removed" };

    const res = await post({ flagId: "flag-thread", action: "remove" });

    expect(res.status).toBe(409);
  });

  it("500s on an unexpected RPC failure", async () => {
    db.rpcError = { message: "connection reset" };

    const res = await post({ flagId: "flag-thread", action: "remove" });

    expect(res.status).toBe(500);
  });
});

describe("POST /api/admin/flags — lock", () => {
  it("locks the reported thread through the lock RPC", async () => {
    const res = await post({ flagId: "flag-thread", action: "lock" });

    expect(res.status).toBe(200);
    expect(rec.rpc).toEqual([
      {
        name: "moderate_lock_thread",
        args: {
          p_thread_id: "thread-1",
          p_flag_id: "flag-thread",
          p_actor_id: ADMIN_ID,
        },
      },
    ]);
  });

  it("400s on an answer report — there is no thread of its own to lock", async () => {
    db.flag = ANSWER_FLAG;

    const res = await post({ flagId: "flag-answer", action: "lock" });

    expect(res.status).toBe(400);
    expect(rec.rpc).toEqual([]);
  });
});

describe("POST /api/admin/flags — resolve / dismiss", () => {
  it("resolve calls moderate_resolve_flag with p_dismiss=false", async () => {
    const res = await post({ flagId: "flag-thread", action: "resolve" });

    expect(res.status).toBe(200);
    expect(rec.rpc).toEqual([
      {
        name: "moderate_resolve_flag",
        args: {
          p_flag_id: "flag-thread",
          p_dismiss: false,
          p_actor_id: ADMIN_ID,
        },
      },
    ]);
  });

  it("dismiss calls moderate_resolve_flag with p_dismiss=true", async () => {
    const res = await post({ flagId: "flag-thread", action: "dismiss" });

    expect(res.status).toBe(200);
    expect(rec.rpc[0]?.args.p_dismiss).toBe(true);
  });

  it("409s if the flag was resolved out from under us (race)", async () => {
    db.rpcError = { message: "Flag not found or already resolved" };

    const res = await post({ flagId: "flag-thread", action: "resolve" });

    expect(res.status).toBe(409);
  });
});

describe("GET /api/admin/flags — links and bodies", () => {
  beforeEach(() => {
    db.pendingFlags = [
      {
        id: "flag-thread",
        reason: "spam",
        details: null,
        created_at: "2026-08-01T00:00:00Z",
        reporter_id: "reporter-1",
        thread_id: "thread-1",
        answer_id: null,
      },
    ];
    db.threads = [
      {
        id: "thread-1",
        title: "reported title",
        slug: "reported-title-ab12",
        category_id: "cat-1",
        body: "the full reported body",
      },
    ];
    db.categories = [{ id: "cat-1", slug: "general" }];
    db.profiles = [{ id: "reporter-1", username: "alice" }];
  });

  it("prefixes the target link with the moderator's locale", async () => {
    const res = await get("https://app.test/pt-BR/admin");
    const body = (await res.json()) as { flags: { url: string }[] };

    expect(body.flags[0]?.url).toBe(
      "/pt-BR/community/general/reported-title-ab12"
    );
  });

  it("falls back to the default locale rather than an unprefixed path", async () => {
    const res = await get();
    const body = (await res.json()) as { flags: { url: string }[] };

    expect(body.flags[0]?.url).toBe(
      "/en/community/general/reported-title-ab12"
    );
  });

  it("ignores an unknown locale segment in the referer", async () => {
    const res = await get("https://app.test/fr/admin");
    const body = (await res.json()) as { flags: { url: string }[] };

    expect(body.flags[0]?.url?.startsWith("/en/")).toBe(true);
  });

  it("carries the full target body so a link-less card is still judgeable", async () => {
    const res = await get();
    const body = (await res.json()) as { flags: { body: string }[] };

    expect(body.flags[0]?.body).toBe("the full reported body");
  });
});
