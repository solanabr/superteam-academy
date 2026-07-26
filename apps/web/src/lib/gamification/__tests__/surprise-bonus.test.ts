import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import {
  SURPRISE_BONUS_AMOUNTS,
  SURPRISE_BONUS_PROBABILITY,
  SURPRISE_BONUS_REASON_PREFIX,
  SURPRISE_BONUS_WEEKLY_CAP,
  isSurpriseBonusReason,
  maybeAwardSurpriseBonus,
  rollSurpriseBonusXp,
  startOfIsoWeekUtc,
  surpriseBonusReason,
} from "@/lib/gamification/surprise-bonus";

/** Deterministic RNG that returns each value in sequence. */
function seq(values: number[]): () => number {
  let i = 0;
  return () => values[i++] ?? 1;
}

/**
 * Minimal chainable Supabase mock. The count query resolves to `weekCount`;
 * `rpc("award_xp", …)` resolves to `{ error: rpcError }` and records its args.
 */
function makeSupabaseMock({
  weekCount = 0,
  countError = null as { message: string } | null,
  rpcError = null as { message: string } | null,
} = {}) {
  const rpc = vi.fn().mockResolvedValue({ error: rpcError });
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    like: vi.fn(() => builder),
    gte: vi.fn(() => Promise.resolve({ count: weekCount, error: countError })),
  };
  const from = vi.fn(() => builder);
  const client = { from, rpc } as unknown as SupabaseClient<Database>;
  return { client, from, rpc, builder };
}

describe("rollSurpriseBonusXp", () => {
  it("returns null when the roll is at or above the probability threshold", () => {
    expect(rollSurpriseBonusXp(seq([SURPRISE_BONUS_PROBABILITY]))).toBeNull();
    expect(rollSurpriseBonusXp(seq([0.99]))).toBeNull();
  });

  it("returns an amount from the fixed ladder when the roll lands", () => {
    // gate passes (0.01 < prob), amount index 0 → first ladder value
    expect(rollSurpriseBonusXp(seq([0.01, 0]))).toBe(SURPRISE_BONUS_AMOUNTS[0]);
    // amount index at the top of the ladder
    expect(rollSurpriseBonusXp(seq([0.01, 0.999]))).toBe(
      SURPRISE_BONUS_AMOUNTS[SURPRISE_BONUS_AMOUNTS.length - 1]
    );
  });

  it("only ever returns capped, small amounts (well under award_xp's 2000 ceiling)", () => {
    for (const amount of SURPRISE_BONUS_AMOUNTS) {
      expect(amount).toBeGreaterThan(0);
      expect(amount).toBeLessThanOrEqual(50);
    }
  });
});

describe("startOfIsoWeekUtc", () => {
  it("returns the Monday 00:00 UTC of the containing week", () => {
    // 2026-07-26 is a Sunday → week starts Monday 2026-07-20
    const start = startOfIsoWeekUtc(new Date("2026-07-26T18:30:00Z"));
    expect(start.toISOString()).toBe("2026-07-20T00:00:00.000Z");
    // A Monday maps to itself
    const monday = startOfIsoWeekUtc(new Date("2026-07-20T09:00:00Z"));
    expect(monday.toISOString()).toBe("2026-07-20T00:00:00.000Z");
  });
});

describe("reason format", () => {
  it("prefixes the lesson id and round-trips through the detector", () => {
    const reason = surpriseBonusReason("lesson-pdas-1");
    expect(reason).toBe(`${SURPRISE_BONUS_REASON_PREFIX}lesson-pdas-1`);
    expect(isSurpriseBonusReason(reason)).toBe(true);
    expect(isSurpriseBonusReason("Completed lesson: lesson-pdas-1")).toBe(
      false
    );
  });
});

describe("maybeAwardSurpriseBonus", () => {
  const base = {
    userId: "user-1",
    lessonId: "lesson-pdas-1",
    txSignature: "sig-abc",
  };

  it("grants nothing — and touches no storage — when the roll misses", async () => {
    // Non-predictability: a missed roll writes NOTHING, so no bonus artifact
    // can ever exist before it is granted. There is no pre-announcement path.
    const { client, from, rpc } = makeSupabaseMock();
    const result = await maybeAwardSurpriseBonus(client, {
      ...base,
      rng: seq([0.9]),
    });
    expect(result).toBeNull();
    expect(from).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("awards via award_xp with the correct amount, reason and idempotency key when under the weekly cap", async () => {
    const { client, rpc } = makeSupabaseMock({ weekCount: 0 });
    const result = await maybeAwardSurpriseBonus(client, {
      ...base,
      rng: seq([0.01, 0]),
    });
    expect(result).toBe(SURPRISE_BONUS_AMOUNTS[0]);
    expect(rpc).toHaveBeenCalledWith("award_xp", {
      p_user_id: "user-1",
      p_amount: SURPRISE_BONUS_AMOUNTS[0],
      p_reason: `${SURPRISE_BONUS_REASON_PREFIX}lesson-pdas-1`,
      p_idempotency_key: "sig-abc:SurpriseBonus",
      p_tx_signature: "sig-abc",
    });
  });

  it("enforces the weekly cap — no award once the cap is reached", async () => {
    const { client, rpc } = makeSupabaseMock({
      weekCount: SURPRISE_BONUS_WEEKLY_CAP,
    });
    const result = await maybeAwardSurpriseBonus(client, {
      ...base,
      rng: seq([0.01, 0]),
    });
    expect(result).toBeNull();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("fail-safe: does not grant when the cap count query errors", async () => {
    const { client, rpc } = makeSupabaseMock({
      countError: { message: "db down" },
    });
    const result = await maybeAwardSurpriseBonus(client, {
      ...base,
      rng: seq([0.01, 0]),
    });
    expect(result).toBeNull();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("throws when the award itself fails, so the caller can log it", async () => {
    const { client } = makeSupabaseMock({ rpcError: { message: "rpc boom" } });
    await expect(
      maybeAwardSurpriseBonus(client, { ...base, rng: seq([0.01, 0]) })
    ).rejects.toThrow("rpc boom");
  });
});
