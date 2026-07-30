import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const rpc = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc }),
}));

import {
  spendAssistTurn,
  refundAssistTurn,
  resetAssists,
  recordBilledAssist,
  getAssistState,
} from "../assist-budget";
import {
  FREE_ASSIST_TURNS,
  METERED_ASSIST_TURNS,
  SOCRATIC_ASSIST_TURNS,
} from "../partner-types";

beforeEach(() => rpc.mockReset());

// Every deny path must read as FULLY exhausted — an error can never look like
// available budget.
const EXHAUSTED = {
  allowed: false,
  tier: "exhausted",
  counts: {
    free: FREE_ASSIST_TURNS,
    metered: METERED_ASSIST_TURNS,
    socratic: SOCRATIC_ASSIST_TURNS,
  },
};

describe("spendAssistTurn", () => {
  it("passes the ladder sizes to the RPC and returns its verdict", async () => {
    rpc.mockResolvedValue({
      data: [
        {
          allowed: true,
          tier: "metered",
          free_turns: 2,
          metered_turns: 3,
          socratic_turns: 0,
        },
      ],
      error: null,
    });
    await expect(spendAssistTurn("u", "l")).resolves.toEqual({
      allowed: true,
      tier: "metered",
      counts: { free: 2, metered: 3, socratic: 0 },
    });
    expect(rpc).toHaveBeenCalledWith("spend_assist_ladder_turn", {
      p_user_id: "u",
      p_lesson_id: "l",
      p_free_max: FREE_ASSIST_TURNS,
      p_metered_max: METERED_ASSIST_TURNS,
      p_socratic_max: SOCRATIC_ASSIST_TURNS,
    });
  });

  it("returns tier 'exhausted' when the RPC denies", async () => {
    rpc.mockResolvedValue({
      data: [
        {
          allowed: false,
          tier: "exhausted",
          free_turns: 2,
          metered_turns: 8,
          socratic_turns: 20,
        },
      ],
      error: null,
    });
    await expect(spendAssistTurn("u", "l")).resolves.toEqual({
      allowed: false,
      tier: "exhausted",
      counts: { free: 2, metered: 8, socratic: 20 },
    });
  });

  it("FAILS CLOSED when the RPC errors", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "db down" } });
    await expect(spendAssistTurn("u", "l")).resolves.toEqual(EXHAUSTED);
  });

  it("FAILS CLOSED when the RPC throws", async () => {
    rpc.mockRejectedValueOnce(new Error("network"));
    await expect(spendAssistTurn("u", "l")).resolves.toEqual(EXHAUSTED);
  });

  it("FAILS CLOSED on an empty rows array", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    await expect(spendAssistTurn("u", "l")).resolves.toEqual(EXHAUSTED);
  });

  it("FAILS CLOSED on a malformed row (missing counts)", async () => {
    rpc.mockResolvedValue({
      data: [{ allowed: true, tier: "free" }],
      error: null,
    });
    await expect(spendAssistTurn("u", "l")).resolves.toEqual(EXHAUSTED);
  });

  it("FAILS CLOSED on an allowed row with a bogus tier", async () => {
    rpc.mockResolvedValue({
      data: [
        {
          allowed: true,
          tier: "premium",
          free_turns: 0,
          metered_turns: 0,
          socratic_turns: 0,
        },
      ],
      error: null,
    });
    await expect(spendAssistTurn("u", "l")).resolves.toEqual(EXHAUSTED);
  });
});

describe("refundAssistTurn", () => {
  it("hands back exactly the spent tier via the ladder refund RPC", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await refundAssistTurn("u", "l", "socratic");
    expect(rpc).toHaveBeenCalledWith("refund_assist_ladder_turn", {
      p_user_id: "u",
      p_lesson_id: "l",
      p_tier: "socratic",
    });
  });

  it("no-ops for tier 'exhausted' (nothing was spent)", async () => {
    await refundAssistTurn("u", "l", "exhausted");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("swallows an RPC error without throwing", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "db down" } });
    await expect(refundAssistTurn("u", "l", "free")).resolves.toBeUndefined();
  });

  it("swallows a thrown RPC without throwing", async () => {
    rpc.mockRejectedValueOnce(new Error("network"));
    await expect(
      refundAssistTurn("u", "l", "metered")
    ).resolves.toBeUndefined();
  });
});

describe("resetAssists", () => {
  it("relays an allowed reset verdict", async () => {
    rpc.mockResolvedValue({
      data: [{ allowed: true, reason: "reset", available_at: null }],
      error: null,
    });
    await expect(resetAssists("u", "l")).resolves.toEqual({
      allowed: true,
      reason: "reset",
      availableAt: null,
    });
    expect(rpc).toHaveBeenCalledWith("reset_challenge_assists", {
      p_user_id: "u",
      p_lesson_id: "l",
    });
  });

  it("relays a cooldown denial with the availability moment", async () => {
    rpc.mockResolvedValue({
      data: [
        {
          allowed: false,
          reason: "cooldown",
          available_at: "2026-08-06T12:00:00.000Z",
        },
      ],
      error: null,
    });
    await expect(resetAssists("u", "l")).resolves.toEqual({
      allowed: false,
      reason: "cooldown",
      availableAt: Date.parse("2026-08-06T12:00:00.000Z"),
    });
  });

  it("FAILS CLOSED (denied) when the RPC errors", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "db down" } });
    await expect(resetAssists("u", "l")).resolves.toEqual({
      allowed: false,
      reason: "error",
      availableAt: null,
    });
  });

  it("FAILS CLOSED (denied) when the RPC throws", async () => {
    rpc.mockRejectedValueOnce(new Error("network"));
    await expect(resetAssists("u", "l")).resolves.toEqual({
      allowed: false,
      reason: "error",
      availableAt: null,
    });
  });
});

describe("recordBilledAssist", () => {
  it("calls the billed-counter RPC with the right args", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await recordBilledAssist("u", "l");
    expect(rpc).toHaveBeenCalledWith("record_billed_assist", {
      p_user_id: "u",
      p_lesson_id: "l",
    });
  });

  it("swallows an RPC error without throwing (best-effort audit write)", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "db down" } });
    await expect(recordBilledAssist("u", "l")).resolves.toBeUndefined();
  });

  it("swallows a thrown RPC without throwing", async () => {
    rpc.mockRejectedValueOnce(new Error("network"));
    await expect(recordBilledAssist("u", "l")).resolves.toBeUndefined();
  });
});

describe("getAssistState", () => {
  it("maps the widened state row into ladder counts + reset availability", async () => {
    rpc.mockResolvedValue({
      data: [
        {
          free_turns: 2,
          metered_turns: 5,
          socratic_turns: 1,
          reset_state: "cooldown",
          reset_available_at: "2026-08-06T12:00:00.000Z",
          chat_log: [{ role: "user", text: "hi" }],
        },
      ],
      error: null,
    });
    await expect(getAssistState("u", "l")).resolves.toEqual({
      counts: { free: 2, metered: 5, socratic: 1 },
      resetState: "cooldown",
      resetAvailableAt: Date.parse("2026-08-06T12:00:00.000Z"),
      log: [{ role: "user", text: "hi" }],
    });
  });

  it("fails soft to an empty state on error (never blocks the lesson)", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "db down" } });
    await expect(getAssistState("u", "l")).resolves.toEqual({
      counts: { free: 0, metered: 0, socratic: 0 },
      resetState: "none",
      resetAvailableAt: null,
      log: [],
    });
  });
});
