import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// One rpc mock backs a single fake admin client for every test.
const rpc = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc }),
}));

import {
  estimateSpendMicroUsd,
  degradedMaxTokens,
  worstCaseMicroUsd,
  reserveAiSpend,
  settleAiSpend,
  releaseAiSpend,
  ratesFor,
  getAiSpendToday,
} from "../spend-ledger";
import { MODEL_RATES } from "../models";

// The wrapper reads caps from serverEnv, which in tests takes the env.server
// defaults: account soft/hard $0.50/$1.50, IP $2/$5, global
// $14/$25, newcomer pool $2/$3. Micro-USD = USD×1e6. Rates are PER MODEL since #868; the pre-existing
// cases below were written against $0.30/$2.50, which is exactly flash-lite's
// sheet, so they pin the cheap tier explicitly.
const LITE = "gemini-3.5-flash-lite" as const;
const FLASH_36 = "gemini-3.6-flash" as const;
const RATES = {
  inputUsdPerMTok: 0.3,
  outputUsdPerMTok: 2.5,
  cachedInputUsdPerMTok: 0.03,
};

beforeEach(() => {
  rpc.mockReset();
});

describe("estimateSpendMicroUsd", () => {
  it("sums input + output at their rates (micro-USD = tokens × usdPerMtok)", () => {
    // 1000 input × 0.30 = 300; 500 output × 2.50 = 1250; total 1550 micro = $0.00155.
    expect(
      estimateSpendMicroUsd(
        { promptTokenCount: 1000, candidatesTokenCount: 500 },
        RATES
      )
    ).toBe(1550);
  });

  it("bills thinking tokens at the OUTPUT rate (#591)", () => {
    // thinking 100 joins the 500 output → 600 × 2.50 = 1500; + 1000×0.30=300 → 1800.
    expect(
      estimateSpendMicroUsd(
        {
          promptTokenCount: 1000,
          candidatesTokenCount: 500,
          thoughtsTokenCount: 100,
        },
        RATES
      )
    ).toBe(1800);
  });

  it("is zero for missing usage metadata (records the request, no cost)", () => {
    expect(estimateSpendMicroUsd(undefined, RATES)).toBe(0);
    expect(estimateSpendMicroUsd({}, RATES)).toBe(0);
  });

  it("treats negative / NaN token counts as zero (never credits)", () => {
    expect(
      estimateSpendMicroUsd(
        { promptTokenCount: -5, candidatesTokenCount: Number.NaN },
        RATES
      )
    ).toBe(0);
  });
});

// Gemini's `promptTokenCount` INCLUDES `cachedContentTokenCount` — the cached
// tokens are a SUBSET, not an addition. Red at main: the ledger billed the whole
// prompt at the full input rate, over-reporting every cache hit by up to 10× and
// tripping the #591 caps early.
describe("estimateSpendMicroUsd — cached prompt tokens (cached-input discount)", () => {
  it("splits the prompt: (prompt − cached) at input, cached at cached-input", () => {
    // 1000 prompt of which 800 cached → 200×0.30 = 60; 800×0.03 = 24; input 84.
    // Output 500×2.50 = 1250. Total 1334.
    expect(
      estimateSpendMicroUsd(
        {
          promptTokenCount: 1000,
          cachedContentTokenCount: 800,
          candidatesTokenCount: 500,
        },
        RATES
      )
    ).toBe(1334);
  });

  it("never ADDS cached to prompt (they are not two separate token pools)", () => {
    // If cached were added, this would price 1800 prompt tokens. It must not:
    // the fully-cached prompt costs 1000×0.03 = 30, plus 1250 output = 1280.
    expect(
      estimateSpendMicroUsd(
        {
          promptTokenCount: 1000,
          cachedContentTokenCount: 1000,
          candidatesTokenCount: 500,
        },
        RATES
      )
    ).toBe(1280);
  });

  it("is unchanged from the pre-cache math when cached is absent or zero", () => {
    const base = estimateSpendMicroUsd(
      { promptTokenCount: 1000, candidatesTokenCount: 500 },
      RATES
    );
    expect(base).toBe(1550);
    expect(
      estimateSpendMicroUsd(
        {
          promptTokenCount: 1000,
          cachedContentTokenCount: 0,
          candidatesTokenCount: 500,
        },
        RATES
      )
    ).toBe(base);
  });

  it("CLAMPS a malformed cached > prompt, billing the whole prompt at input rate", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // cached 5000 > prompt 1000 is impossible. Discard the discount rather than
    // let a shape we don't understand produce a negative uncached remainder
    // (which would UNDER-bill, the dangerous direction on a sponsored key).
    expect(
      estimateSpendMicroUsd(
        {
          promptTokenCount: 1000,
          cachedContentTokenCount: 5000,
          candidatesTokenCount: 500,
        },
        RATES
      )
    ).toBe(1550); // identical to no-cache: 1000×0.30 + 500×2.50
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("ignores a negative cached count (nonNegInt) — no free credit", () => {
    expect(
      estimateSpendMicroUsd(
        {
          promptTokenCount: 1000,
          cachedContentTokenCount: -900,
          candidatesTokenCount: 500,
        },
        RATES
      )
    ).toBe(1550);
  });
});

describe("degradedMaxTokens", () => {
  it("halves the budget, floored at 256 so the reply stays usable", () => {
    expect(degradedMaxTokens(2048)).toBe(1024);
    expect(degradedMaxTokens(1536)).toBe(768);
    expect(degradedMaxTokens(300)).toBe(256); // floor wins
  });
});

function mockReserve(row: unknown, error: unknown = null) {
  rpc.mockResolvedValue({ data: [row], error });
}

const RESERVED_ROW = {
  decision: "full",
  reserved_micro_usd: "24360", // BIGINT arrives as a string from PostgREST
  reserved_day: "2026-11-08",
  low_trust: true,
};

const AMOUNTS = { fullMicroUsd: 24_360, degradedMicroUsd: 16_680 };

describe("worstCaseMicroUsd", () => {
  it("prices the whole prompt uncached and the whole output budget", () => {
    // 6000 × 1.50 + 2048 × 7.50 = 9000 + 15360.
    expect(worstCaseMicroUsd(FLASH_36, 6000, 2048)).toBe(24_360);
    // 3000 × 0.30 + 512 × 2.50 = 900 + 1280.
    expect(worstCaseMicroUsd(LITE, 3000, 512)).toBe(2180);
  });
});

describe("reserveAiSpend", () => {
  it("sends both tier amounts and every cap in micro-USD from env defaults", async () => {
    mockReserve(RESERVED_ROW);
    await reserveAiSpend("u", "1.2.3.4", AMOUNTS);
    expect(rpc).toHaveBeenCalledWith("reserve_ai_spend", {
      p_user_id: "u",
      p_ip: "1.2.3.4",
      p_full_micro_usd: 24_360,
      p_degraded_micro_usd: 16_680,
      p_account_soft: 500_000,
      p_account_hard: 1_500_000,
      p_ip_soft: 2_000_000,
      p_ip_hard: 5_000_000,
      p_global_soft: 14_000_000,
      p_global_hard: 25_000_000,
      p_newcomer_soft: 2_000_000,
      p_newcomer_hard: 3_000_000,
    });
  });

  it("returns the tier and the hold to settle later", async () => {
    mockReserve(RESERVED_ROW);
    expect(await reserveAiSpend("u", "1.2.3.4", AMOUNTS)).toEqual({
      decision: "full",
      reservation: {
        userId: "u",
        ip: "1.2.3.4",
        spendDay: "2026-11-08",
        lowTrust: true,
        reservedMicroUsd: 24_360,
      },
    });
  });

  it("passes a degraded decision through", async () => {
    mockReserve({
      ...RESERVED_ROW,
      decision: "degraded",
      reserved_micro_usd: 16_680,
      low_trust: false,
    });
    const gate = await reserveAiSpend("u", "1.2.3.4", AMOUNTS);
    expect(gate).toMatchObject({
      decision: "degraded",
      reservation: { reservedMicroUsd: 16_680, lowTrust: false },
    });
  });

  it("denies (spend_cap) when the ledger has no room", async () => {
    mockReserve({ ...RESERVED_ROW, decision: "denied", reserved_micro_usd: 0 });
    expect(await reserveAiSpend("u", "1.2.3.4", AMOUNTS)).toEqual({
      decision: "denied",
      reason: "spend_cap",
    });
  });

  it("FAILS CLOSED (denied/ledger_unavailable) on an RPC error", async () => {
    mockReserve(null, { message: "connection refused" });
    expect(await reserveAiSpend("u", "1.2.3.4", AMOUNTS)).toEqual({
      decision: "denied",
      reason: "ledger_unavailable",
    });
  });

  it("FAILS CLOSED when the rpc call itself throws", async () => {
    rpc.mockRejectedValue(new Error("boom"));
    expect(await reserveAiSpend("u", "1.2.3.4", AMOUNTS)).toEqual({
      decision: "denied",
      reason: "ledger_unavailable",
    });
  });

  it("FAILS CLOSED on a missing row", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    expect(await reserveAiSpend("u", "1.2.3.4", AMOUNTS)).toEqual({
      decision: "denied",
      reason: "ledger_unavailable",
    });
  });

  for (const [label, patch] of [
    ["an unknown decision", { decision: "maybe" }],
    ["a non-numeric hold", { reserved_micro_usd: "lots" }],
    ["a missing day", { reserved_day: null }],
    ["a non-boolean low_trust", { low_trust: "yes" }],
  ] as const) {
    it(`FAILS CLOSED on ${label}`, async () => {
      mockReserve({ ...RESERVED_ROW, ...patch });
      expect(await reserveAiSpend("u", "1.2.3.4", AMOUNTS)).toEqual({
        decision: "denied",
        reason: "ledger_unavailable",
      });
    });
  }
});

describe("ratesFor (per-model pricing, #868)", () => {
  it("prices each routed model from its own sheet (economics doc §2.1)", () => {
    expect(ratesFor("gemini-3.6-flash")).toEqual({
      inputUsdPerMTok: 1.5,
      outputUsdPerMTok: 7.5,
      cachedInputUsdPerMTok: 0.15,
    });
    expect(ratesFor("gemini-3.5-flash-lite")).toEqual({
      inputUsdPerMTok: 0.3,
      outputUsdPerMTok: 2.5,
      cachedInputUsdPerMTok: 0.03,
    });
    // Kept as the documented fallback pin — and what pre-#868 traffic cost.
    expect(ratesFor("gemini-3.5-flash")).toEqual({
      inputUsdPerMTok: 1.5,
      outputUsdPerMTok: 9.0,
      cachedInputUsdPerMTok: 0.15,
    });
  });

  it("carries a cached-input rate for EVERY routed model (ledger cannot bill without one)", () => {
    for (const model of Object.keys(
      MODEL_RATES
    ) as (keyof typeof MODEL_RATES)[]) {
      const r = ratesFor(model);
      expect(r.cachedInputUsdPerMTok).toBeGreaterThan(0);
      expect(r.cachedInputUsdPerMTok).toBeLessThan(r.inputUsdPerMTok);
    }
  });

  it("matches MODEL_RATES exactly when no env override is set", () => {
    for (const [model, sheet] of Object.entries(MODEL_RATES)) {
      expect(ratesFor(model as keyof typeof MODEL_RATES)).toEqual(sheet);
    }
  });
});

const HOLD = {
  userId: "u",
  ip: "1.2.3.4",
  spendDay: "2026-11-08",
  lowTrust: true,
  reservedMicroUsd: 24_360,
};

function settleArgs(actual: number, billed = true) {
  return {
    p_user_id: "u",
    p_ip: "1.2.3.4",
    p_spend_day: "2026-11-08",
    p_low_trust: true,
    p_reserved_micro_usd: 24_360,
    p_actual_micro_usd: actual,
    p_billed: billed,
  };
}

describe("settleAiSpend", () => {
  it("settles the hold to the metered cost of the routed model", async () => {
    // Before #868 the ledger took no model and priced every call at one
    // global rate pair. The same usage must price per model.
    rpc.mockResolvedValue({ data: null, error: null });
    const usage = { promptTokenCount: 1000, candidatesTokenCount: 500 };

    await settleAiSpend(HOLD, FLASH_36, usage);
    // 1000×1.50 = 1500 input; 500×7.50 = 3750 output → 5250 micro-USD.
    expect(rpc).toHaveBeenLastCalledWith("settle_ai_spend", settleArgs(5250));

    await settleAiSpend(HOLD, LITE, usage);
    // Same tokens on the cheap tier: 1000×0.30 + 500×2.50 = 1550.
    expect(rpc).toHaveBeenLastCalledWith("settle_ai_spend", settleArgs(1550));
  });

  it("books the cached-input discount at the routed model's rates", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    // 3.6-flash: 4000 prompt of which 3500 cached → 500×1.50 = 750;
    // 3500×0.15 = 525; output 200×7.50 = 1500. Total 2775.
    await settleAiSpend(HOLD, FLASH_36, {
      promptTokenCount: 4000,
      cachedContentTokenCount: 3500,
      candidatesTokenCount: 200,
    });
    expect(rpc).toHaveBeenLastCalledWith("settle_ai_spend", settleArgs(2775));
  });

  it("books a CONSERVATIVE fallback when usageMetadata is absent (#724)", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    // 3000 input × 0.30 = 900; 512 output × 2.50 = 1280; total 2180 micro.
    await settleAiSpend(HOLD, LITE, undefined, {
      promptTokens: 3000,
      outputTokens: 512,
    });
    expect(rpc).toHaveBeenLastCalledWith("settle_ai_spend", settleArgs(2180));
  });

  it("prices the fallback at the routed model's rates too", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    // 3000×1.50 + 512×7.50 = 8340.
    await settleAiSpend(HOLD, FLASH_36, undefined, {
      promptTokens: 3000,
      outputTokens: 512,
    });
    expect(rpc).toHaveBeenLastCalledWith("settle_ai_spend", settleArgs(8340));
  });

  it("prefers the METERED estimate over the fallback when usage is present", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await settleAiSpend(
      HOLD,
      LITE,
      { promptTokenCount: 1000, candidatesTokenCount: 500 },
      { promptTokens: 9999, outputTokens: 9999 }
    );
    expect(rpc).toHaveBeenLastCalledWith("settle_ai_spend", settleArgs(1550));
  });

  it("falls back when usage is present but measures zero", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await settleAiSpend(
      HOLD,
      LITE,
      {},
      { promptTokens: 3000, outputTokens: 512 }
    );
    expect(rpc).toHaveBeenLastCalledWith("settle_ai_spend", settleArgs(2180));
  });

  it("never throws when the settle RPC errors", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "down" } });
    await expect(
      settleAiSpend(HOLD, LITE, { promptTokenCount: 10 })
    ).resolves.toBeUndefined();
  });

  it("never throws when the settle RPC rejects", async () => {
    rpc.mockRejectedValue(new Error("network"));
    await expect(
      settleAiSpend(HOLD, LITE, { promptTokenCount: 10 })
    ).resolves.toBeUndefined();
  });
});

describe("releaseAiSpend", () => {
  it("returns the whole hold and counts no request", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await releaseAiSpend(HOLD);
    expect(rpc).toHaveBeenCalledWith("settle_ai_spend", settleArgs(0, false));
  });

  it("never throws when the RPC fails", async () => {
    rpc.mockRejectedValue(new Error("network"));
    await expect(releaseAiSpend(HOLD)).resolves.toBeUndefined();
  });
});

describe("getAiSpendToday", () => {
  it("returns today's global burn + request count", async () => {
    rpc.mockResolvedValue({
      data: [{ micro_usd: 4_200_000, request_count: 137 }],
      error: null,
    });
    expect(await getAiSpendToday()).toEqual({
      microUsd: 4_200_000,
      requestCount: 137,
    });
  });

  it("fails soft to zeros on a read error", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "down" } });
    expect(await getAiSpendToday()).toEqual({ microUsd: 0, requestCount: 0 });
  });
});
