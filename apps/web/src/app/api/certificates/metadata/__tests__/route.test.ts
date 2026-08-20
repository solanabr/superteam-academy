/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const single = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/cookieless", () => ({
  createCookielessClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ single }) }) }),
  }),
}));

import { GET } from "../route";

function req(path: string): NextRequest {
  return new NextRequest(`http://localhost${path}`);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/certificates/metadata", () => {
  it("200s with a browser TTL + CDN day cache on success", async () => {
    single.mockResolvedValue({ data: { data: { name: "Cert" } }, error: null });
    const res = await GET(req("/api/certificates/metadata?id=abc"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ name: "Cert" });
    // max-age gives browsers an hour; NOT immutable/1y (metadata is updatable
    // post-mint). CDN mirror required or Vercel strips the s-maxage.
    expect(res.headers.get("Cache-Control")).toBe(
      "public, max-age=3600, s-maxage=86400"
    );
    expect(res.headers.get("CDN-Cache-Control")).toBe("public, s-maxage=86400");
  });

  it("404s WITHOUT cache headers when no row exists", async () => {
    single.mockResolvedValue({ data: null, error: { code: "PGRST116" } });
    const res = await GET(req("/api/certificates/metadata?id=missing"));
    expect(res.status).toBe(404);
    expect(res.headers.get("CDN-Cache-Control")).toBeNull();
  });

  it("500s WITHOUT cache headers on a DB error", async () => {
    single.mockResolvedValue({
      data: null,
      error: { code: "XX000", message: "boom" },
    });
    const res = await GET(req("/api/certificates/metadata?id=abc"));
    expect(res.status).toBe(500);
    expect(res.headers.get("CDN-Cache-Control")).toBeNull();
  });

  it("400s on a missing id", async () => {
    const res = await GET(req("/api/certificates/metadata"));
    expect(res.status).toBe(400);
    expect(res.headers.get("CDN-Cache-Control")).toBeNull();
    expect(single).not.toHaveBeenCalled();
  });
});
