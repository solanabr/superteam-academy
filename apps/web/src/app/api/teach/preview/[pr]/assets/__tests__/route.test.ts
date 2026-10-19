/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

const env = vi.hoisted(() => ({
  serverEnv: { GITHUB_TOKEN: "ghs_test" as string | undefined },
}));
vi.mock("@/lib/env.server", () => env);

// The store is the compile cache; stub it so this file is about SERVING files.
// The compile itself is covered in `lib/teach/__tests__/preview-compile-assets`.
const store = vi.hoisted(() => ({ getPreviewBundle: vi.fn() }));
vi.mock("@/lib/teach/preview-store", () => store);

import { NextRequest } from "next/server";
import { GET } from "../[...path]/route";
import { MAX_ASSET_BYTES } from "@/lib/content/compile/assets";
import {
  mintPreviewSession,
  TEACH_PREVIEW_COOKIE,
} from "@/lib/teach/preview-auth";

const SHA = "c".repeat(40);
const PNG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const SVG = new TextEncoder().encode(
  "<svg xmlns='http://www.w3.org/2000/svg'/>"
);
const PNG_KEY = "courses/demo/lessons/accounts/assets/pixel.png";
const SVG_KEY = "courses/demo/lessons/accounts/assets/diagram.svg";

function bundle(): unknown {
  return {
    head: { sha: SHA },
    imagePaths: new Set([PNG_KEY, SVG_KEY]),
  };
}

const fetchMock = vi.fn();

/** GitHub answers the contents request with `body`, labelled as HTML on purpose. */
function github(body: Uint8Array, init: ResponseInit = {}): void {
  fetchMock.mockResolvedValue(
    new Response(new Uint8Array(body), {
      status: 200,
      headers: { "content-type": "text/html" },
      ...init,
    })
  );
}

function request(authed: boolean): NextRequest {
  const headers = new Headers();
  if (authed) {
    headers.set(
      "cookie",
      `${TEACH_PREVIEW_COOKIE}=${encodeURIComponent(mintPreviewSession())}`
    );
  }
  return new NextRequest("https://app.test/api/teach/preview/34/assets/x", {
    headers,
  });
}

function ctx(
  pr: string,
  path: string[]
): { params: Promise<{ pr: string; path: string[] }> } {
  return { params: Promise.resolve({ pr, path }) };
}

beforeEach(() => {
  store.getPreviewBundle.mockReset();
  store.getPreviewBundle.mockResolvedValue(bundle());
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/teach/preview/[pr]/assets/[...path] (#923)", () => {
  it("streams one allowlisted file from the content repo at the PR head", async () => {
    github(PNG);

    const res = await GET(request(true), ctx("34", PNG_KEY.split("/")));

    expect(res.status).toBe(200);
    // Our content type, from the extension — never the upstream's.
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(PNG);
    expect(store.getPreviewBundle).toHaveBeenCalledWith(34);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      `https://api.github.com/repos/solanabr/academy-courses/contents/${PNG_KEY}?ref=${SHA}`
    );
    expect(init.redirect).toBe("error");
  });

  it("hardens the response: nosniff, locked-down CSP, private cache", async () => {
    github(SVG);

    // SVG is the case that matters — authored, unreviewed, and script-capable
    // if a browser ever renders it as a document on our own origin.
    const res = await GET(request(true), ctx("34", SVG_KEY.split("/")));

    expect(res.headers.get("content-type")).toBe("image/svg+xml");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("content-security-policy")).toContain(
      "default-src 'none'"
    );
    // Unpublished content behind a session cookie: no shared cache may hold it.
    expect(res.headers.get("cache-control")).toBe("private, max-age=60");
  });

  it("401s without a preview session, and never reaches the bundle", async () => {
    const res = await GET(request(false), ctx("34", PNG_KEY.split("/")));

    expect(res.status).toBe(401);
    expect(store.getPreviewBundle).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [["..", "..", "etc", "passwd.png"]],
    [["courses", "%2e%2e", "%2e%2e", "other-repo", "x.png"]],
    [["courses", "demo", ".", "x.png"]],
    [["courses", "demo%2F..%2F..", "x.png"]],
  ])("404s traversal %j without fetching anything", async (path) => {
    const res = await GET(request(true), ctx("34", path));

    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("404s a path the compiled preview never referenced", async () => {
    const res = await GET(
      request(true),
      ctx("34", ["courses", "demo", "assets", "secret.png"])
    );

    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("404s a non-image path before loading the bundle", async () => {
    const res = await GET(
      request(true),
      ctx("34", ["courses", "demo", "course.yaml"])
    );

    expect(res.status).toBe(404);
    expect(store.getPreviewBundle).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a file over the per-image cap instead of relaying it", async () => {
    github(new Uint8Array(MAX_ASSET_BYTES + 1));

    const res = await GET(request(true), ctx("34", PNG_KEY.split("/")));

    expect(res.status).toBe(502);
  });

  it("refuses a declared oversize body without reading it", async () => {
    github(PNG, {
      headers: { "content-length": String(MAX_ASSET_BYTES + 1) },
    });

    const res = await GET(request(true), ctx("34", PNG_KEY.split("/")));

    expect(res.status).toBe(502);
  });

  it("502s when GitHub does not have the file", async () => {
    fetchMock.mockResolvedValue(new Response("Not Found", { status: 404 }));

    const res = await GET(request(true), ctx("34", PNG_KEY.split("/")));

    expect(res.status).toBe(502);
  });

  it("rejects a non-numeric pr segment before compiling anything", async () => {
    const res = await GET(request(true), ctx("../admin", ["x.png"]));

    expect(res.status).toBe(400);
    expect(store.getPreviewBundle).not.toHaveBeenCalled();
  });

  it("502s when the PR will not compile, instead of hanging on the error", async () => {
    store.getPreviewBundle.mockRejectedValue(new Error("boom"));

    const res = await GET(request(true), ctx("34", PNG_KEY.split("/")));

    expect(res.status).toBe(502);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
