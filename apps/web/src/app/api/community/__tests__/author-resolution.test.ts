import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

// Community route GET handlers used to embed the author via
// `author:profiles!author_id(...)`, which PostgREST resolves under the CALLER's
// RLS on profiles. #493 drops the public-profile row policy, so that embed now
// returns null for every author but the caller. These tests pin the fix: each
// route must resolve authors through the public_profiles view (never the raw
// profiles table / embed), and a private/missing author must degrade to the
// anonymous shape (username/avatar null, level 0) instead of crashing.

const state = vi.hoisted(() => ({
  user: null as { id: string } | null,
  tables: {} as Record<string, unknown[]>,
  single: {} as Record<string, unknown>,
  fromCalls: [] as string[],
  selectArgs: [] as string[],
}));

function makeClient() {
  const from = (table: string) => {
    state.fromCalls.push(table);
    const result = { data: state.tables[table] ?? null, error: null };
    const builder: Record<string, unknown> = {
      select: (arg?: unknown) => {
        if (typeof arg === "string") state.selectArgs.push(arg);
        return builder;
      },
      is: () => builder,
      limit: () => builder,
      eq: () => builder,
      in: () => builder,
      or: () => builder,
      order: () => builder,
      textSearch: () => builder,
      single: async () => ({ data: state.single[table] ?? null, error: null }),
      maybeSingle: async () => ({
        data: state.single[table] ?? null,
        error: null,
      }),
      then: (onF: (v: unknown) => unknown, onR?: (e: unknown) => unknown) =>
        Promise.resolve(result).then(onF, onR),
    };
    return builder;
  };
  return {
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from,
  };
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => makeClient(),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => makeClient(),
}));
vi.mock("@/lib/env.server", () => ({ serverEnv: {} }));
vi.mock("@/lib/gamification/achievements", () => ({
  checkCommunityAchievements: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({ isRateLimited: vi.fn() }));
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));

import { GET as threadsGET } from "../threads/route";
import { GET as threadDetailGET } from "../threads/[id]/route";
import { GET as searchGET } from "../search/route";

beforeEach(() => {
  state.user = null;
  state.tables = {};
  state.single = {};
  state.fromCalls = [];
  state.selectArgs = [];
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
});

// alice is public (present in public_profiles); bob is private/missing (absent).
function seedAuthors() {
  state.tables.public_profiles = [
    { id: "alice", username: "alice", avatar_url: "a.png" },
  ];
  state.tables.public_user_xp = [{ user_id: "alice", level: 3 }];
}

describe("GET /api/community/threads — author identity via public_profiles", () => {
  it("resolves authors from public_profiles, never the raw profiles embed", async () => {
    seedAuthors();
    state.tables.threads = [
      { id: "t1", author_id: "alice" },
      { id: "t2", author_id: "bob" },
    ];

    const res = await threadsGET(
      new NextRequest("http://localhost/api/community/threads")
    );
    const body = await res.json();

    expect(state.fromCalls).toContain("public_profiles");
    expect(state.fromCalls).not.toContain("profiles");
    // The threads select must no longer embed the RLS-bound author join.
    expect(state.selectArgs.some((s) => s.includes("author:profiles"))).toBe(
      false
    );

    expect(body.threads[0].author).toEqual({
      username: "alice",
      avatar_url: "a.png",
      level: 3,
    });
    // Private/missing author degrades to the anonymous shape, not a crash.
    expect(body.threads[1].author).toEqual({
      username: null,
      avatar_url: null,
      level: 0,
    });
  });
});

describe("GET /api/community/search — author identity via public_profiles", () => {
  it("resolves authors from public_profiles and blanks the missing ones", async () => {
    seedAuthors();
    state.tables.threads = [
      { id: "t1", author_id: "alice" },
      { id: "t2", author_id: "bob" },
    ];

    const res = await searchGET(
      new NextRequest("http://localhost/api/community/search?q=solana")
    );
    const body = await res.json();

    expect(state.fromCalls).toContain("public_profiles");
    expect(state.fromCalls).not.toContain("profiles");
    expect(state.selectArgs.some((s) => s.includes("author:profiles"))).toBe(
      false
    );
    expect(body.threads[0].author.username).toBe("alice");
    expect(body.threads[1].author).toEqual({
      username: null,
      avatar_url: null,
      level: 0,
    });
  });
});

describe("GET /api/community/threads/[id] — thread + answer authors via public_profiles", () => {
  it("resolves thread and answer authors from public_profiles, missing ones anonymous", async () => {
    seedAuthors();
    state.single.threads = {
      id: "th1",
      author_id: "alice",
      short_id: "shortid1",
    };
    state.tables.answers = [{ id: "an1", author_id: "bob" }];

    const res = await threadDetailGET(
      new NextRequest("http://localhost/api/community/threads/shortid1"),
      { params: Promise.resolve({ id: "shortid1" }) }
    );
    const body = await res.json();

    expect(state.fromCalls).toContain("public_profiles");
    expect(state.fromCalls).not.toContain("profiles");
    expect(state.selectArgs.some((s) => s.includes("author:profiles"))).toBe(
      false
    );

    expect(body.author).toEqual({
      username: "alice",
      avatar_url: "a.png",
      level: 3,
    });
    expect(body.answers[0].author).toEqual({
      username: null,
      avatar_url: null,
      level: 0,
    });
  });
});
