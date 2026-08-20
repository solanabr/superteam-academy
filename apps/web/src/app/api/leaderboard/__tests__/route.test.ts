/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const getCachedLeaderboard = vi.hoisted(() => vi.fn());
vi.mock("@/lib/leaderboard/global", () => ({ getCachedLeaderboard }));

import { GET } from "../route";

const CACHE_VALUE = "public, s-maxage=60, stale-while-revalidate=300";

function req(path: string): NextRequest {
  return new NextRequest(`http://localhost${path}`);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/leaderboard", () => {
  it("200s with CDN cache headers on success", async () => {
    getCachedLeaderboard.mockResolvedValue([{ userId: "u1", rank: 1 }]);
    const res = await GET(req("/api/leaderboard?timeframe=alltime"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      entries: [{ userId: "u1", rank: 1 }],
    });
    expect(res.headers.get("Cache-Control")).toBe(CACHE_VALUE);
    expect(res.headers.get("CDN-Cache-Control")).toBe(CACHE_VALUE);
    expect(getCachedLeaderboard).toHaveBeenCalledWith("alltime");
  });

  it("defaults to weekly", async () => {
    getCachedLeaderboard.mockResolvedValue([]);
    const res = await GET(req("/api/leaderboard"));
    expect(res.status).toBe(200);
    expect(getCachedLeaderboard).toHaveBeenCalledWith("weekly");
  });

  it("500s WITHOUT cache headers when the cached read throws (F1: a transient failure must not be CDN-cached)", async () => {
    getCachedLeaderboard.mockRejectedValue(new Error("rpc down"));
    const res = await GET(req("/api/leaderboard?timeframe=weekly"));
    expect(res.status).toBe(500);
    expect(res.headers.get("Cache-Control")).toBeNull();
    expect(res.headers.get("CDN-Cache-Control")).toBeNull();
  });

  it("400s WITHOUT cache headers on an invalid timeframe", async () => {
    const res = await GET(req("/api/leaderboard?timeframe=daily"));
    expect(res.status).toBe(400);
    expect(res.headers.get("CDN-Cache-Control")).toBeNull();
    expect(getCachedLeaderboard).not.toHaveBeenCalled();
  });
});
