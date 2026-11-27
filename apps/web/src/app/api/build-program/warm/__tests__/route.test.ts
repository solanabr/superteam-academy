/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

interface LimiterOptions {
  maxTokens: number;
  refillIntervalMs: number;
  failClosed?: boolean;
}

const h = vi.hoisted(() => ({
  env: {
    BUILD_SERVER_URL: "https://build.test" as string | undefined,
    BUILD_SERVER_API_KEY: "test-key" as string | undefined,
  },
  getUser: vi.fn<() => Promise<unknown>>(),
  isRateLimited:
    vi.fn<
      (ns: string, key: string, opts: LimiterOptions) => Promise<boolean>
    >(),
  logError: vi.fn(),
}));

vi.mock("@/lib/env.server", () => ({ serverEnv: h.env }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: h.getUser } }),
}));
vi.mock("@/lib/rate-limit", () => ({ isRateLimited: h.isRateLimited }));
vi.mock("@/lib/logging", () => ({ logError: h.logError, logEvent: vi.fn() }));

import { POST } from "../route";

const fetchMock = vi.fn<typeof fetch>();

async function call() {
  const res = await POST();
  const text = await res.text();
  return {
    status: res.status,
    text,
    body: JSON.parse(text) as { status?: string; error?: string },
  };
}

/** A health request that never answers; it rejects only when aborted. */
function hangUntilAborted(init?: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () =>
      reject(Object.assign(new Error("aborted"), { name: "AbortError" }))
    );
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  h.env.BUILD_SERVER_URL = "https://build.test";
  h.env.BUILD_SERVER_API_KEY = "test-key";
  h.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  h.isRateLimited.mockResolvedValue(false);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("POST /api/build-program/warm", () => {
  it("refuses a signed-out caller without calling upstream", async () => {
    h.getUser.mockResolvedValue({ data: { user: null } });

    const { status, body } = await call();

    expect(status).toBe(401);
    expect(body.status).toBeUndefined();
    expect(h.isRateLimited).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("health answers OK → ready", async () => {
    fetchMock.mockResolvedValue(new Response('{"status":"ok"}'));

    const { status, body } = await call();

    expect(status).toBe(200);
    expect(body).toEqual({ status: "ready" });
  });

  it("calls /health with no API key header", async () => {
    fetchMock.mockResolvedValue(new Response("ok"));

    await call();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://build.test/health");
    expect(init?.method ?? "GET").toBe("GET");
    const headers = new Headers(init?.headers);
    expect(headers.has("x-api-key")).toBe(false);
    expect(headers.has("authorization")).toBe(false);
    expect(JSON.stringify(init ?? {})).not.toContain("test-key");
  });

  it("limits each user to one call per five minutes, skipping when the limiter cannot check", async () => {
    fetchMock.mockResolvedValue(new Response("ok"));

    await call();

    expect(h.isRateLimited).toHaveBeenCalledWith(
      "build-program-warm",
      "user-1",
      {
        maxTokens: 1,
        refillIntervalMs: 5 * 60_000,
        failClosed: true,
      }
    );
  });

  it("rate limited → skipped, without calling upstream", async () => {
    h.isRateLimited.mockResolvedValue(true);

    const { status, body } = await call();

    expect(status).toBe(200);
    expect(body).toEqual({ status: "skipped" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["BUILD_SERVER_URL", "BUILD_SERVER_API_KEY"] as const)(
    "%s unset → skipped, without spending a rate-limit token",
    async (name) => {
      h.env[name] = undefined;

      const { status, body } = await call();

      expect(status).toBe(200);
      expect(body).toEqual({ status: "skipped" });
      expect(h.isRateLimited).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it("no answer within the wait → waking, and the request is aborted", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation((_url, init) => hangUntilAborted(init));

    const pending = call();
    await vi.advanceTimersByTimeAsync(3_900);
    expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(200);
    const { status, body } = await pending;

    expect(status).toBe(200);
    expect(body).toEqual({ status: "waking" });
    expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  });

  it.each([401, 404, 500, 503])(
    "health answers %i → down",
    async (upstream) => {
      fetchMock.mockResolvedValue(
        new Response("upstream body that must stay private", {
          status: upstream,
        })
      );

      const { status, text, body } = await call();

      expect(status).toBe(200);
      expect(body).toEqual({ status: "down" });
      expect(text).not.toContain("upstream body");
    }
  );

  it("connection refused → down, without the upstream URL", async () => {
    fetchMock.mockRejectedValue(
      new TypeError("fetch failed: connect ECONNREFUSED https://build.test")
    );

    const { status, text, body } = await call();

    expect(status).toBe(200);
    expect(body).toEqual({ status: "down" });
    expect(text).not.toContain("build.test");
  });

  it("an unexpected error → skipped, never a thrown response", async () => {
    h.getUser.mockRejectedValue(new Error("auth backend: https://build.test"));

    const { status, text, body } = await call();

    expect(status).toBe(200);
    expect(body).toEqual({ status: "skipped" });
    expect(text).not.toContain("build.test");
  });
});
