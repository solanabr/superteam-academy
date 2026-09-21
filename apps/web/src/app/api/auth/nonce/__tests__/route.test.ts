// The nonce route's housekeeping used to be two unawaited DELETEs with
// `.then(() => {})` and no rejection handler. Postgres deletes in 0.13 ms; the
// p95 of 185 s was a hung Vercel→Supabase socket, and with nothing catching it
// the failure became an unhandled rejection instead of a log line. These tests
// pin the three properties that fixes it: ONE statement, bounded, and unable to
// affect the response.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env.server", () => ({
  serverEnv: { SUPABASE_SERVICE_ROLE_KEY: "service-key" },
}));
vi.mock("@/lib/rate-limit", () => ({ getClientIp: () => "203.0.113.7" }));
vi.mock("@/lib/solana/wallet-auth", () => ({
  generateNonce: () => "nonce-under-test",
}));
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));

interface DeleteCall {
  orFilter?: string;
  signal?: AbortSignal;
}

const state = vi.hoisted(() => ({
  deletes: [] as DeleteCall[],
  deleteResult: Promise.resolve({ error: null }) as Promise<{
    error: { message: string } | null;
  }>,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => {
      const call: DeleteCall = {};
      const selectBuilder = {
        eq: () => selectBuilder,
        gte: () => selectBuilder,
        abortSignal: () => Promise.resolve({ count: 0, error: null }),
      };
      const deleteBuilder = {
        or(filter: string) {
          call.orFilter = filter;
          return deleteBuilder;
        },
        abortSignal(signal: AbortSignal) {
          call.signal = signal;
          state.deletes.push(call);
          return state.deleteResult;
        },
      };
      return {
        select: () => selectBuilder,
        insert: () => Promise.resolve({ error: null }),
        delete: () => deleteBuilder,
      };
    },
  }),
}));

const { GET } = await import("../route");

function request() {
  return new Request("https://academy.test/api/auth/nonce", {
    headers: { host: "academy.test" },
  }) as never;
}

beforeEach(() => {
  state.deletes = [];
  state.deleteResult = Promise.resolve({ error: null });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/auth/nonce cleanup", () => {
  it("issues ONE DELETE covering both expiry legs", async () => {
    const res = await GET(request());
    expect(res.status).toBe(200);
    expect(state.deletes).toHaveLength(1);
    expect(state.deletes[0]?.orFilter).toMatch(
      /and\(status\.eq\.pending,created_at\.lt\.[^)]+\),and\(status\.eq\.consumed,created_at\.lt\.[^)]+\)/
    );
  });

  it("bounds the cleanup with an abort signal", async () => {
    await GET(request());
    expect(state.deletes[0]?.signal).toBeInstanceOf(AbortSignal);
  });

  it("still returns the nonce when cleanup rejects, and swallows the rejection", async () => {
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    state.deleteResult = Promise.reject(new TypeError("fetch failed"));

    const res = await GET(request());
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ nonce: "nonce-under-test" });

    // Let the microtask queue drain so an uncaught rejection would surface.
    await new Promise((r) => setTimeout(r, 0));
    process.off("unhandledRejection", unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });

  it("logs a cleanup error without failing the request", async () => {
    state.deleteResult = Promise.resolve({ error: { message: "nope" } });
    const res = await GET(request());
    expect(res.status).toBe(200);
    await new Promise((r) => setTimeout(r, 0));
    expect(console.error).toHaveBeenCalledWith(
      "[SIWS] Nonce cleanup error:",
      "nope"
    );
  });
});
