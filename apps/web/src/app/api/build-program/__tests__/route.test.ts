/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => ({
  env: {
    BUILD_SERVER_URL: "https://build.test" as string | undefined,
    BUILD_SERVER_API_KEY: "test-key" as string | undefined,
  },
  getUser: vi.fn<() => Promise<unknown>>(),
  isRateLimited: vi.fn<() => Promise<boolean>>(),
  logEvent:
    vi.fn<
      (params: { event: string; context?: Record<string, unknown> }) => void
    >(),
  logError: vi.fn(),
}));

vi.mock("@/lib/env.server", () => ({ serverEnv: h.env }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: h.getUser } }),
}));
vi.mock("@/lib/rate-limit", () => ({ isRateLimited: h.isRateLimited }));
vi.mock("@/lib/logging", () => ({
  logEvent: h.logEvent,
  logError: h.logError,
}));

import { POST } from "../route";

const fetchMock = vi.fn<typeof fetch>();

interface Body {
  success: boolean;
  error?: string;
  kind?: string;
  binaryB64?: string;
}

function req(
  body: unknown = { files: [{ path: "/src/lib.rs", content: "" }] }
) {
  return new NextRequest("http://localhost/api/build-program", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

async function call(body?: unknown) {
  const res = await POST(req(body));
  return { status: res.status, body: (await res.json()) as Body };
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function html(status: number): Response {
  return new Response("<html><body>upstream page</body></html>", {
    status,
    headers: { "content-type": "text/html" },
  });
}

function unavailableEvents() {
  return h.logEvent.mock.calls
    .map(([params]) => params)
    .filter((params) => params.event === "build-program.unavailable");
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
  vi.unstubAllGlobals();
});

describe("POST /api/build-program", () => {
  it("returns the build result on success", async () => {
    fetchMock.mockResolvedValue(
      json(200, { success: true, stderr: "", uuid: "u1", binary_b64: "AAAA" })
    );

    const { status, body } = await call();

    expect(status).toBe(200);
    expect(body).toMatchObject({ success: true, binaryB64: "AAAA" });
    expect(body.kind).toBeUndefined();
    expect(unavailableEvents()).toHaveLength(0);
  });

  it("passes a compile failure through without a kind", async () => {
    fetchMock.mockResolvedValue(
      json(200, { success: false, stderr: "error[E0425]", uuid: null })
    );

    const { status, body } = await call();

    expect(status).toBe(200);
    expect(body.success).toBe(false);
    expect(body.kind).toBeUndefined();
  });

  it("not configured → 503 unavailable", async () => {
    h.env.BUILD_SERVER_URL = undefined;

    const { status, body } = await call();

    expect(status).toBe(503);
    expect(body.kind).toBe("unavailable");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(unavailableEvents()).toHaveLength(1);
  });

  it("signed out → 401 rejected", async () => {
    h.getUser.mockResolvedValue({ data: { user: null } });

    const { status, body } = await call();

    expect(status).toBe(401);
    expect(body.kind).toBe("rejected");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rate limited → 429 busy", async () => {
    h.isRateLimited.mockResolvedValue(true);

    const { status, body } = await call();

    expect(status).toBe(429);
    expect(body.kind).toBe("busy");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("no files → 400 rejected", async () => {
    const { status, body } = await call({ files: [] });

    expect(status).toBe(400);
    expect(body.kind).toBe("rejected");
  });

  it("oversized source → 400 rejected", async () => {
    const { status, body } = await call({
      files: [{ path: "/src/lib.rs", content: "x".repeat(500 * 1024 + 1) }],
    });

    expect(status).toBe(400);
    expect(body.kind).toBe("rejected");
  });

  it("connection failure → 504 unavailable, logged without an upstream status", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    const { status, body } = await call();

    expect(status).toBe(504);
    expect(body.kind).toBe("unavailable");
    expect(unavailableEvents()).toEqual([
      {
        event: "build-program.unavailable",
        context: { upstreamStatus: null },
      },
    ]);
  });

  it("upstream abort → 504 timeout", async () => {
    fetchMock.mockRejectedValue(
      Object.assign(new Error("aborted"), { name: "AbortError" })
    );

    const { status, body } = await call();

    expect(status).toBe(504);
    expect(body.kind).toBe("timeout");
    expect(unavailableEvents()).toHaveLength(0);
  });

  it.each([401, 403, 404, 500, 502])(
    "upstream %i → 502 unavailable, logged with the status only",
    async (upstream) => {
      fetchMock.mockResolvedValue(
        json(upstream, { error: "upstream detail that must not be forwarded" })
      );

      const { status, body } = await call();

      expect(status).toBe(502);
      expect(body.kind).toBe("unavailable");
      expect(JSON.stringify(body)).not.toContain("upstream detail");
      expect(unavailableEvents()).toEqual([
        {
          event: "build-program.unavailable",
          context: { upstreamStatus: upstream },
        },
      ]);
    }
  );

  it("upstream 503 with the queue-full JSON → 502 busy", async () => {
    fetchMock.mockResolvedValue(
      json(503, { error: "Build queue is full, try again later" })
    );

    const { status, body } = await call();

    expect(status).toBe(502);
    expect(body.kind).toBe("busy");
    expect(unavailableEvents()).toHaveLength(0);
  });

  it("upstream 503 with an HTML page → 502 unavailable", async () => {
    fetchMock.mockResolvedValue(html(503));

    const { status, body } = await call();

    expect(status).toBe(502);
    expect(body.kind).toBe("unavailable");
    expect(JSON.stringify(body)).not.toContain("upstream page");
    expect(unavailableEvents()).toEqual([
      { event: "build-program.unavailable", context: { upstreamStatus: 503 } },
    ]);
  });

  it("upstream 400 → 502 rejected with the build server's message", async () => {
    fetchMock.mockResolvedValue(
      json(400, {
        error: "Blocked name 'env' found in /src/lib.rs; rename it",
      })
    );

    const { status, body } = await call();

    expect(status).toBe(502);
    expect(body.kind).toBe("rejected");
    expect(body.error).toBe(
      "Blocked name 'env' found in /src/lib.rs; rename it"
    );
    expect(unavailableEvents()).toHaveLength(0);
  });

  it("caps the length of a rejected message", async () => {
    fetchMock.mockResolvedValue(json(400, { error: "x".repeat(5000) }));

    const { body } = await call();

    expect(body.kind).toBe("rejected");
    expect(body.error?.length).toBeLessThanOrEqual(500);
  });

  it("upstream 400 without the JSON error → 502 unavailable", async () => {
    fetchMock.mockResolvedValue(html(400));

    const { status, body } = await call();

    expect(status).toBe(502);
    expect(body.kind).toBe("unavailable");
  });

  it("upstream 200 with an unreadable body → 502 unavailable", async () => {
    fetchMock.mockResolvedValue(html(200));

    const { status, body } = await call();

    expect(status).toBe(502);
    expect(body.kind).toBe("unavailable");
    expect(unavailableEvents()).toEqual([
      { event: "build-program.unavailable", context: { upstreamStatus: 200 } },
    ]);
  });

  it.each([
    ["an empty object", {}],
    ["a non-boolean success", { success: "true", stderr: "" }],
    ["no stderr", { success: true, uuid: "u1" }],
  ])("upstream 200 with %s → 502 unavailable", async (_name, upstream) => {
    fetchMock.mockResolvedValue(json(200, upstream));

    const { status, body } = await call();

    expect(status).toBe(502);
    expect(body.kind).toBe("unavailable");
    expect(unavailableEvents()).toEqual([
      { event: "build-program.unavailable", context: { upstreamStatus: 200 } },
    ]);
  });

  it("upstream 429 → 502 busy", async () => {
    fetchMock.mockResolvedValue(
      new Response("Too Many Requests! Wait for 2s", { status: 429 })
    );

    const { status, body } = await call();

    expect(status).toBe(502);
    expect(body.kind).toBe("busy");
    expect(JSON.stringify(body)).not.toContain("Too Many Requests");
    expect(unavailableEvents()).toHaveLength(0);
  });

  it("a request body that is not JSON → 400 rejected, not logged as unavailable", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/build-program", {
        method: "POST",
        body: "{not json",
        headers: { "content-type": "application/json" },
      })
    );
    const body = (await res.json()) as Body;

    expect(res.status).toBe(400);
    expect(body.kind).toBe("rejected");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(unavailableEvents()).toHaveLength(0);
    expect(h.logError).not.toHaveBeenCalled();
  });

  it.each([
    ["null", null],
    ["a string", "files"],
    ["files that is not an array", { files: "lib.rs" }],
    ["an entry without content", { files: [{ path: "/src/lib.rs" }] }],
    ["an entry without a path", { files: [{ content: "" }] }],
    ["a non-string content", { files: [{ path: "/src/lib.rs", content: 1 }] }],
    ["a non-string path", { files: [{ path: 1, content: "" }] }],
    ["a null entry", { files: [null] }],
    [
      "a non-string uuid",
      { files: [{ path: "/src/lib.rs", content: "" }], uuid: 7 },
    ],
  ])(
    "a request body with %s → 400 rejected, not logged as unavailable",
    async (_name, requestBody) => {
      const { status, body } = await call(requestBody);

      expect(status).toBe(400);
      expect(body.kind).toBe("rejected");
      expect(fetchMock).not.toHaveBeenCalled();
      expect(unavailableEvents()).toHaveLength(0);
      expect(h.logError).not.toHaveBeenCalled();
    }
  );

  it("unexpected handler error → 500 unavailable", async () => {
    h.getUser.mockRejectedValue(new Error("boom"));

    const { status, body } = await call();

    expect(status).toBe(500);
    expect(body.kind).toBe("unavailable");
    expect(h.logError).toHaveBeenCalledTimes(1);
  });
});
