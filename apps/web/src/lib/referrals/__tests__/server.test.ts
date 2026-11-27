/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: h.rpc, from: h.from }),
}));
vi.mock("@/lib/logging", () => ({ logError: h.logError }));

import { getOwnReferralStats, recordReferralCoursePoint } from "../server";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("recordReferralCoursePoint", () => {
  it("mints via the SECURITY DEFINER rpc with the completing learner + course", async () => {
    h.rpc.mockResolvedValue({ data: true, error: null });
    await recordReferralCoursePoint("user-1", "course-a");
    expect(h.rpc).toHaveBeenCalledWith("record_referral_course_completion", {
      p_user_id: "user-1",
      p_course_id: "course-a",
    });
    expect(h.logError).not.toHaveBeenCalled();
  });

  it("NEVER throws — a referral failure must not fail the finalize webhook", async () => {
    h.rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(
      recordReferralCoursePoint("user-1", "course-a")
    ).resolves.toBeUndefined();
    expect(h.logError).toHaveBeenCalledTimes(1);

    h.rpc.mockRejectedValue(new Error("network down"));
    await expect(
      recordReferralCoursePoint("user-1", "course-a")
    ).resolves.toBeUndefined();
    expect(h.logError).toHaveBeenCalledTimes(2);
  });
});

/** `.from("referral_seasons").select().lte().order().limit().maybeSingle()` */
function seasonQuery(data: unknown) {
  const chain = {
    select: () => chain,
    lte: () => chain,
    order: () => chain,
    limit: () => chain,
    maybeSingle: () => Promise.resolve({ data, error: null }),
  };
  return chain;
}

const SEASON = {
  number: 1,
  starts_at: "2026-08-18T00:00:00+00:00",
  ends_at: "2026-11-18T00:00:00+00:00",
};

describe("getOwnReferralStats", () => {
  it("reads points and signups from get_own_referral_totals, scoped to the season", async () => {
    h.from.mockImplementation((table: string) => {
      if (table === "referral_seasons") return seasonQuery(SEASON);
      throw new Error(`unexpected table read: ${table}`);
    });
    h.rpc.mockImplementation((name: string) => {
      if (name === "get_or_create_referral_code")
        return Promise.resolve({ data: "abcd1234", error: null });
      if (name === "get_own_referral_totals")
        return Promise.resolve({
          data: [{ season_points: 3, referred_signups: 2 }],
          error: null,
        });
      return Promise.reject(new Error(`unexpected rpc: ${name}`));
    });

    const stats = await getOwnReferralStats("user-1");

    expect(h.rpc).toHaveBeenCalledWith("get_own_referral_totals", {
      p_user_id: "user-1",
      p_season_starts_at: SEASON.starts_at,
      p_season_ends_at: SEASON.ends_at,
    });
    expect(stats).toEqual({
      code: "abcd1234",
      seasonPoints: 3,
      referredSignups: 2,
      season: {
        number: 1,
        startsAt: SEASON.starts_at,
        endsAt: SEASON.ends_at,
      },
    });
  });

  it("with no season yet, passes a null window and still returns signups", async () => {
    h.from.mockImplementation(() => seasonQuery(null));
    h.rpc.mockImplementation((name: string) =>
      Promise.resolve(
        name === "get_or_create_referral_code"
          ? { data: "abcd1234", error: null }
          : { data: [{ season_points: 0, referred_signups: 1 }], error: null }
      )
    );

    const stats = await getOwnReferralStats("user-1");

    expect(h.rpc).toHaveBeenCalledWith("get_own_referral_totals", {
      p_user_id: "user-1",
      p_season_starts_at: null,
      p_season_ends_at: null,
    });
    expect(stats.seasonPoints).toBe(0);
    expect(stats.referredSignups).toBe(1);
    expect(stats.season).toBeNull();
  });

  it("throws when the totals read fails", async () => {
    h.from.mockImplementation(() => seasonQuery(SEASON));
    h.rpc.mockImplementation((name: string) =>
      Promise.resolve(
        name === "get_or_create_referral_code"
          ? { data: "abcd1234", error: null }
          : { data: null, error: { message: "boom" } }
      )
    );

    await expect(getOwnReferralStats("user-1")).rejects.toThrow("boom");
  });
});
