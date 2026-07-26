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
  checkAiSpend,
  recordAiSpend,
  getAiSpendToday,
} from "../spend-ledger";

// The wrapper reads caps/rates from serverEnv, which in tests takes the
// env.server defaults (O-1 numbers): account soft/hard $0.50/$1.50, IP $2/$5,
// global $14/$25; rates $0.30 input, $2.50 output per Mtok. Micro-USD = USD×1e6.
const RATES = { inputUsdPerMTok: 0.3, outputUsdPerMTok: 2.5 };

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

describe("degradedMaxTokens", () => {
  it("halves the budget, floored at 256 so the reply stays usable", () => {
    expect(degradedMaxTokens(2048)).toBe(1024);
    expect(degradedMaxTokens(1536)).toBe(768);
    expect(degradedMaxTokens(300)).toBe(256); // floor wins
  });
});

function mockCheck(row: unknown, error: unknown = null) {
  rpc.mockResolvedValue({ data: [row], error });
}

describe("checkAiSpend", () => {
  it("returns full when every dimension is under its soft cap", async () => {
    mockCheck({
      account_micro_usd: 0,
      ip_micro_usd: 0,
      global_micro_usd: 0,
    });
    expect(await checkAiSpend("u", "1.2.3.4")).toEqual({ decision: "full" });
  });

  it("degrades when a dimension crosses its soft cap (account $0.50)", async () => {
    mockCheck({
      account_micro_usd: 600_000, // $0.60 > $0.50 soft, < $1.50 hard
      ip_micro_usd: 0,
      global_micro_usd: 0,
    });
    expect(await checkAiSpend("u", "1.2.3.4")).toEqual({
      decision: "degraded",
    });
  });

  it("denies (spend_cap) when the account hard cap is reached ($1.50)", async () => {
    mockCheck({
      account_micro_usd: 1_500_000,
      ip_micro_usd: 0,
      global_micro_usd: 0,
    });
    expect(await checkAiSpend("u", "1.2.3.4")).toEqual({
      decision: "denied",
      reason: "spend_cap",
    });
  });

  it("denies (spend_cap) when the IP hard cap is reached ($5)", async () => {
    mockCheck({
      account_micro_usd: 0,
      ip_micro_usd: 5_000_000,
      global_micro_usd: 0,
    });
    expect(await checkAiSpend("u", "1.2.3.4")).toEqual({
      decision: "denied",
      reason: "spend_cap",
    });
  });

  it("denies (spend_cap) when the GLOBAL hard cap is reached ($25)", async () => {
    mockCheck({
      account_micro_usd: 0,
      ip_micro_usd: 0,
      global_micro_usd: 25_000_000,
    });
    expect(await checkAiSpend("u", "1.2.3.4")).toEqual({
      decision: "denied",
      reason: "spend_cap",
    });
  });

  it("coerces BIGINT-as-string totals from PostgREST before comparing", async () => {
    mockCheck({
      account_micro_usd: "600000", // string, still > soft
      ip_micro_usd: "0",
      global_micro_usd: "0",
    });
    expect(await checkAiSpend("u", "1.2.3.4")).toEqual({
      decision: "degraded",
    });
  });

  it("FAILS CLOSED (denied/ledger_unavailable) on an RPC error", async () => {
    mockCheck(null, { message: "connection refused" });
    expect(await checkAiSpend("u", "1.2.3.4")).toEqual({
      decision: "denied",
      reason: "ledger_unavailable",
    });
  });

  it("FAILS CLOSED on a missing row", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    expect(await checkAiSpend("u", "1.2.3.4")).toEqual({
      decision: "denied",
      reason: "ledger_unavailable",
    });
  });

  it("FAILS CLOSED on non-numeric totals", async () => {
    mockCheck({
      account_micro_usd: "not-a-number",
      ip_micro_usd: 0,
      global_micro_usd: 0,
    });
    expect(await checkAiSpend("u", "1.2.3.4")).toEqual({
      decision: "denied",
      reason: "ledger_unavailable",
    });
  });

  it("FAILS CLOSED when the rpc call itself throws", async () => {
    rpc.mockRejectedValue(new Error("boom"));
    expect(await checkAiSpend("u", "1.2.3.4")).toEqual({
      decision: "denied",
      reason: "ledger_unavailable",
    });
  });
});

describe("recordAiSpend", () => {
  it("books the computed micro-USD via record_ai_spend", async () => {
    rpc.mockResolvedValue({ data: null, error: null });

    await recordAiSpend("u", "1.2.3.4", {
      promptTokenCount: 1000,
      candidatesTokenCount: 500,
    });

    expect(rpc).toHaveBeenCalledWith("record_ai_spend", {
      p_user_id: "u",
      p_ip: "1.2.3.4",
      p_micro_usd: 1550,
    });
  });

  it("never throws when the record RPC errors (best-effort audit)", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "down" } });
    await expect(
      recordAiSpend("u", "1.2.3.4", { promptTokenCount: 10 })
    ).resolves.toBeUndefined();
  });

  it("never throws when the record RPC rejects", async () => {
    rpc.mockRejectedValue(new Error("network"));
    await expect(
      recordAiSpend("u", "1.2.3.4", { promptTokenCount: 10 })
    ).resolves.toBeUndefined();
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
