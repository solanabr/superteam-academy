/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

// The store is the compile cache; stub it so this file is about SERVING bytes.
// The compile itself is covered in `lib/teach/__tests__/preview-compile-assets`.
const store = vi.hoisted(() => ({ getPreviewBundle: vi.fn() }));
vi.mock("@/lib/teach/preview-store", () => store);

import { NextRequest } from "next/server";
import { GET } from "../[...path]/route";
import {
  mintPreviewSession,
  TEACH_PREVIEW_COOKIE,
} from "@/lib/teach/preview-auth";

const PNG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const SVG = new TextEncoder().encode(
  "<svg xmlns='http://www.w3.org/2000/svg'/>"
);
const PNG_KEY = "demo/accounts/pixel.png";
const SVG_KEY = "demo/accounts/diagram.svg";

function bundle(): unknown {
  return {
    assets: new Map<string, Uint8Array>([
      [PNG_KEY, PNG],
      [SVG_KEY, SVG],
    ]),
  };
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
});

describe("GET /api/teach/preview/[pr]/assets/[...path] (#923)", () => {
  it("serves the cached bytes for the compiled key", async () => {
    store.getPreviewBundle.mockResolvedValue(bundle());

    const res = await GET(request(true), ctx("34", PNG_KEY.split("/")));

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(PNG);
    expect(store.getPreviewBundle).toHaveBeenCalledWith(34);
  });

  it("hardens the response: nosniff, locked-down CSP, private cache", async () => {
    store.getPreviewBundle.mockResolvedValue(bundle());

    // SVG is the case that matters — authored, unreviewed, and script-capable
    // if a browser ever renders it as a document on our own origin.
    const res = await GET(request(true), ctx("34", SVG_KEY.split("/")));

    expect(res.headers.get("content-type")).toBe("image/svg+xml");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("content-security-policy")).toContain(
      "default-src 'none'"
    );
    // Unpublished content behind a session cookie: no shared cache may hold it.
    expect(res.headers.get("cache-control")).toContain("private");
  });

  it("401s without a preview session, and never reaches the bundle", async () => {
    const res = await GET(request(false), ctx("34", PNG_KEY.split("/")));

    expect(res.status).toBe(401);
    expect(store.getPreviewBundle).not.toHaveBeenCalled();
  });

  it("404s a traversal attempt — the path is a map key, not a filesystem path", async () => {
    store.getPreviewBundle.mockResolvedValue(bundle());

    const res = await GET(
      request(true),
      ctx("34", ["..", "..", "etc", "passwd"])
    );

    expect(res.status).toBe(404);
  });

  it("404s a key the compiler never emitted", async () => {
    store.getPreviewBundle.mockResolvedValue(bundle());

    const res = await GET(request(true), ctx("34", ["demo", "nope.png"]));

    expect(res.status).toBe(404);
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
  });
});
