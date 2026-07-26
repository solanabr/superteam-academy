/* eslint-disable import/order -- vi.mock must hoist above the imports it stubs */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// #731: getStreak must not swallow a PostgREST error into a `?? 0` default — a
// failed read is a DISTINCT degraded state (available:false), never a "0 day
// streak", and it must be logged.
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));

import { logError } from "@/lib/logging";
import { HybridProgressService } from "../hybrid-progress-service";

type Resp = {
  data: unknown;
  error: { code?: string; message: string } | null;
};

// Minimal PostgREST-builder stub. user_xp resolves via `.single()`; the frozen
// table resolves by awaiting the builder itself (thenable). Both terminate in
// the same `{ data, error }` shape the real client returns.
function makeClient(userXp: Resp, frozen: Resp): SupabaseClient<Database> {
  const build = (resp: Resp) => {
    const builder = {
      select: () => builder,
      eq: () => builder,
      single: () => Promise.resolve(resp),
      then: (onF: (v: Resp) => unknown, onR?: (e: unknown) => unknown) =>
        Promise.resolve(resp).then(onF, onR),
    };
    return builder;
  };
  const client = {
    from: (table: string) => build(table === "user_xp" ? userXp : frozen),
  };
  return client as unknown as SupabaseClient<Database>;
}

const OK_XP: Resp = {
  data: {
    current_streak: 5,
    longest_streak: 9,
    last_activity_date: "2026-07-26",
    streak_freezes: 1,
  },
  error: null,
};
const OK_FROZEN: Resp = { data: [{ frozen_date: "2026-07-20" }], error: null };

describe("getStreak — honest degradation (#731)", () => {
  beforeEach(() => vi.mocked(logError).mockClear());

  it("happy path: returns available data and logs nothing", async () => {
    const svc = new HybridProgressService(makeClient(OK_XP, OK_FROZEN));
    const streak = await svc.getStreak("u1");
    expect(streak.available).toBe(true);
    expect(streak.currentStreak).toBe(5);
    expect(streak.freezesRemaining).toBe(1);
    expect(streak.frozenDays).toEqual(["2026-07-20"]);
    expect(logError).not.toHaveBeenCalled();
  });

  it("user_xp read error → degraded (available:false), NOT a zero streak, and logged", async () => {
    const xpErr: Resp = {
      data: null,
      error: { code: "42703", message: "column streak_freezes does not exist" },
    };
    const svc = new HybridProgressService(makeClient(xpErr, OK_FROZEN));
    const streak = await svc.getStreak("u1");
    expect(streak.available).toBe(false);
    expect(streak.currentStreak).toBe(0); // safe default, but flagged unavailable
    expect(streak.frozenDays).toEqual([]);
    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({ errorId: "getStreak.user_xp" })
    );
  });

  it("streak_freezes_used read error → degraded independently, and logged", async () => {
    const frozenErr: Resp = {
      data: null,
      error: {
        code: "PGRST205",
        message: "Could not find the table streak_freezes_used",
      },
    };
    const svc = new HybridProgressService(makeClient(OK_XP, frozenErr));
    const streak = await svc.getStreak("u1");
    expect(streak.available).toBe(false);
    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({ errorId: "getStreak.streak_freezes_used" })
    );
  });

  it("brand-new user (no row, PGRST116) is a TRUE available zero, not degraded", async () => {
    const noRow: Resp = {
      data: null,
      error: { code: "PGRST116", message: "no rows" },
    };
    const svc = new HybridProgressService(makeClient(noRow, OK_FROZEN));
    const streak = await svc.getStreak("u1");
    expect(streak.available).toBe(true);
    expect(streak.currentStreak).toBe(0);
    expect(logError).not.toHaveBeenCalled();
  });
});
