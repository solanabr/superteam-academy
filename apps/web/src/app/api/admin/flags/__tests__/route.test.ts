/* eslint-disable import/order -- vi.mock("server-only") must be hoisted above
   the route import so the `server-only` graph loads under vitest. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

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

const ADMIN_ID = "admin-user-1";
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
  updates: { table: string; values: Record<string, unknown>; id: string }[];
  inserts: { table: string; values: Record<string, unknown> }[];
}

const db = {
  flag: null as Record<string, unknown> | null,
  flagLookupError: null as Err,
  rpcError: null as Err,
  lockError: null as Err,
  flagUpdateError: null as Err,
  auditError: null as Err,
  // GET fixtures
  pendingFlags: [] as Record<string, unknown>[],
  answers: [] as Record<string, unknown>[],
  threads: [] as Record<string, unknown>[],
  categories: [] as Record<string, unknown>[],
  profiles: [] as Record<string, unknown>[],
};

let rec: Recorded;

/** Thenable query builder: every chained filter returns itself. */
class Q implements PromiseLike<{ data: unknown; error: Err }> {
  constructor(
    private readonly resolveTo: () => { data: unknown; error: Err },
    private readonly onEq?: (id: string) => void
  ) {}
  eq(_col: string, value: string): this {
    this.onEq?.(value);
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
    return Promise.resolve(this.resolveTo());
  }
  then<R1, R2 = never>(
    onfulfilled?:
      | ((v: { data: unknown; error: Err }) => R1 | PromiseLike<R1>)
      | null,
    onrejected?: ((r: unknown) => R2 | PromiseLike<R2>) | null
  ): PromiseLike<R1 | R2> {
    return Promise.resolve(this.resolveTo()).then(onfulfilled, onrejected);
  }
}

const TABLE_ROWS: Record<string, () => Record<string, unknown>[]> = {
  flags: () => db.pendingFlags,
  answers: () => db.answers,
  threads: () => db.threads,
  forum_categories: () => db.categories,
  profiles: () => db.profiles,
};

const adminClient = {
  from(table: string) {
    return {
      select: () =>
        new Q(() =>
          table === "flags" && db.flag !== undefined && db.flagLookupError
            ? { data: null, error: db.flagLookupError }
            : { data: TABLE_ROWS[table]?.() ?? [], error: null }
        ),
      update: (values: Record<string, unknown>) =>
        new Q(
          () => ({
            data: null,
            error: table === "threads" ? db.lockError : db.flagUpdateError,
          }),
          (id) => rec.updates.push({ table, values, id })
        ),
      insert: (values: Record<string, unknown>) => {
        rec.inserts.push({ table, values });
        return new Q(() => ({ data: null, error: db.auditError }));
      },
    };
  },
  rpc(name: string, args: Record<string, unknown>) {
    rec.rpc.push({ name, args });
    return Promise.resolve({ data: null, error: db.rpcError });
  },
};

// The POST flag lookup uses `.maybeSingle()`, which the shared builder above
// resolves from TABLE_ROWS — override it for the single-row read.
const flagLookup = {
  select: () =>
    ({
      eq: () => ({
        maybeSingle: () =>
          Promise.resolve({ data: db.flag, error: db.flagLookupError }),
      }),
    }) as unknown as Q,
};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      const base = adminClient.from(table);
      if (table === "flags") {
        return { ...base, select: flagLookupSelect ?? base.select };
      }
      return base;
    },
    rpc: adminClient.rpc,
  }),
}));

// GET reads `flags` with `.select().eq().order().limit()`; POST reads it with
// `.select().eq().maybeSingle()`. One handle switches which shape is served.
let flagLookupSelect: (() => unknown) | null = null;

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
  rec = { rpc: [], updates: [], inserts: [] };
  db.flag = THREAD_FLAG;
  db.flagLookupError = null;
  db.rpcError = null;
  db.lockError = null;
  db.flagUpdateError = null;
  db.auditError = null;
  db.pendingFlags = [];
  db.answers = [];
  db.threads = [];
  db.categories = [];
  db.profiles = [];
  flagLookupSelect = flagLookup.select as unknown as () => unknown;
});

describe("POST /api/admin/flags — auth and validation", () => {
  it("401s without an admin session and touches nothing", async () => {
    h.state.authThrows = true;

    const res = await post({ flagId: "flag-thread", action: "remove" });

    expect(res.status).toBe(401);
    expect(rec.rpc).toEqual([]);
    expect(rec.updates).toEqual([]);
    expect(rec.inserts).toEqual([]);
    expect(isRateLimited).not.toHaveBeenCalled();
  });

  it("400s on an unknown action without touching content", async () => {
    const res = await post({ flagId: "flag-thread", action: "ban" });

    expect(res.status).toBe(400);
    expect(rec.rpc).toEqual([]);
    expect(rec.updates).toEqual([]);
  });

  it("400s when flagId is missing", async () => {
    const res = await post({ action: "remove" });
    expect(res.status).toBe(400);
  });

  it("404s on a flag that does not exist", async () => {
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
    expect(rec.updates).toEqual([]);
    expect(rec.inserts).toEqual([]);
    expect(isRateLimited).toHaveBeenCalledWith(
      "admin-moderate",
      ADMIN_ID,
      expect.objectContaining({ maxTokens: expect.any(Number) })
    );
  });
});

describe("POST /api/admin/flags — remove", () => {
  it("soft-deletes a reported thread, resolves the flag, audits it", async () => {
    const res = await post({ flagId: "flag-thread", action: "remove" });

    expect(res.status).toBe(200);
    expect(rec.rpc).toEqual([
      {
        name: "moderate_soft_delete_thread",
        args: { p_thread_id: "thread-1" },
      },
    ]);
    expect(rec.updates).toEqual([
      {
        table: "flags",
        id: "flag-thread",
        values: expect.objectContaining({
          status: "resolved",
          resolved_by: ADMIN_ID,
        }) as unknown as Record<string, unknown>,
      },
    ]);
    expect(rec.inserts[0]).toEqual({
      table: "moderation_actions",
      values: expect.objectContaining({
        action: "removed_thread",
        thread_id: "thread-1",
        flag_id: "flag-thread",
        actor_id: ADMIN_ID,
      }) as unknown as Record<string, unknown>,
    });
  });

  it("soft-deletes a reported answer via the answer RPC", async () => {
    db.flag = ANSWER_FLAG;

    const res = await post({ flagId: "flag-answer", action: "remove" });

    expect(res.status).toBe(200);
    expect(rec.rpc).toEqual([
      {
        name: "moderate_soft_delete_answer",
        args: { p_answer_id: "answer-1" },
      },
    ]);
    expect(rec.inserts[0]?.values.action).toBe("removed_answer");
  });

  it("409s (not 500) when the target is already removed, and writes nothing else", async () => {
    db.rpcError = { message: "Thread not found or already removed" };

    const res = await post({ flagId: "flag-thread", action: "remove" });

    expect(res.status).toBe(409);
    expect(rec.updates).toEqual([]);
    expect(rec.inserts).toEqual([]);
  });

  it("500s on an unexpected RPC failure without resolving the flag", async () => {
    db.rpcError = { message: "connection reset" };

    const res = await post({ flagId: "flag-thread", action: "remove" });

    expect(res.status).toBe(500);
    expect(rec.updates).toEqual([]);
    expect(rec.inserts).toEqual([]);
  });
});

describe("POST /api/admin/flags — lock", () => {
  it("locks the reported thread and LEAVES the flag pending", async () => {
    const res = await post({ flagId: "flag-thread", action: "lock" });

    expect(res.status).toBe(200);
    expect(rec.updates).toEqual([
      { table: "threads", id: "thread-1", values: { is_locked: true } },
    ]);
    expect(rec.updates.some((u) => u.table === "flags")).toBe(false);
    expect(rec.inserts[0]?.values.action).toBe("locked_thread");
  });

  it("400s on an answer report — there is no thread of its own to lock", async () => {
    db.flag = ANSWER_FLAG;

    const res = await post({ flagId: "flag-answer", action: "lock" });

    expect(res.status).toBe(400);
    expect(rec.updates).toEqual([]);
    expect(rec.inserts).toEqual([]);
  });

  it("500s when the lock write fails, and does not audit a lock that never landed", async () => {
    db.lockError = { message: "boom" };

    const res = await post({ flagId: "flag-thread", action: "lock" });

    expect(res.status).toBe(500);
    expect(rec.inserts).toEqual([]);
  });
});

describe("POST /api/admin/flags — resolve / dismiss", () => {
  it("resolve marks the flag resolved, attributes it, and touches no content", async () => {
    const res = await post({ flagId: "flag-thread", action: "resolve" });

    expect(res.status).toBe(200);
    expect(rec.rpc).toEqual([]);
    expect(rec.updates[0]?.values).toMatchObject({
      status: "resolved",
      resolved_by: ADMIN_ID,
    });
    expect(rec.inserts[0]?.values.action).toBe("resolved");
  });

  it("dismiss marks the flag dismissed", async () => {
    const res = await post({ flagId: "flag-thread", action: "dismiss" });

    expect(res.status).toBe(200);
    expect(rec.updates[0]?.values).toMatchObject({ status: "dismissed" });
    expect(rec.inserts[0]?.values.action).toBe("dismissed");
  });

  it("500s when the flag update fails", async () => {
    db.flagUpdateError = { message: "nope" };

    const res = await post({ flagId: "flag-thread", action: "dismiss" });

    expect(res.status).toBe(500);
    expect(rec.inserts).toEqual([]);
  });
});

describe("POST /api/admin/flags — audit failure is reported, not swallowed", () => {
  it("returns audited:false when the audit insert fails after the action landed", async () => {
    db.auditError = { message: "audit table unreachable" };
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await post({ flagId: "flag-thread", action: "remove" });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, audited: false });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe("GET /api/admin/flags — links and bodies", () => {
  beforeEach(() => {
    flagLookupSelect = null; // GET uses the list-shaped flags read
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
