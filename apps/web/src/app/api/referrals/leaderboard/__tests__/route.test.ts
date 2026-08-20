/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const getReferralLeaderboard = vi.hoisted(() => vi.fn());
vi.mock("@/lib/referrals/server", () => ({ getReferralLeaderboard }));

import { GET } from "../route";

const CACHE_VALUE = "public, s-maxage=60, stale-while-revalidate=300";

function req(path: string): NextRequest {
  return new NextRequest(`http://localhost${path}`);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/referrals/leaderboard", () => {
  it("200s with CDN cache headers on success", async () => {
    getReferralLeaderboard.mockResolvedValue({
      season: { number: 2 },
      standings: [],
    });
    const res = await GET(req("/api/referrals/leaderboard?season=2"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe(CACHE_VALUE);
    expect(res.headers.get("CDN-Cache-Control")).toBe(CACHE_VALUE);
    expect(getReferralLeaderboard).toHaveBeenCalledWith(2, 20);
  });

  it("400s on non-canonical season spellings (F3: no distinct CDN keys for '1a'/'01'/'+1'/'1.9')", async () => {
    for (const bad of ["1a", "01", "+1", "1.9", "0", "-1", "1e2", " 1"]) {
      const res = await GET(
        req(`/api/referrals/leaderboard?season=${encodeURIComponent(bad)}`)
      );
      expect(res.status, `season=${bad}`).toBe(400);
      expect(res.headers.get("CDN-Cache-Control"), `season=${bad}`).toBeNull();
    }
    expect(getReferralLeaderboard).not.toHaveBeenCalled();
  });

  it("400s past the season cap", async () => {
    const res = await GET(req("/api/referrals/leaderboard?season=10001"));
    expect(res.status).toBe(400);
    expect(getReferralLeaderboard).not.toHaveBeenCalled();
  });

  it("500s WITHOUT cache headers on a read failure", async () => {
    getReferralLeaderboard.mockRejectedValue(new Error("boom"));
    const res = await GET(req("/api/referrals/leaderboard"));
    expect(res.status).toBe(500);
    expect(res.headers.get("CDN-Cache-Control")).toBeNull();
  });
});
