/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Keypair } from "@solana/web3.js";
import type { Connection } from "@solana/web3.js";

const env = vi.hoisted(() => ({ max: undefined as number | undefined }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/logging", () => ({ logEvent: vi.fn() }));
vi.mock("@/lib/env.server", () => ({
  serverEnv: {
    get PRIORITY_FEE_MAX_MICROLAMPORTS() {
      return env.max;
    },
  },
}));

import {
  clampPriorityFee,
  DEFAULT_PRIORITY_FEE_MAX_MICROLAMPORTS,
  estimatePriorityFee,
  resetPriorityFeeStateForTests,
} from "../priority-fee";
import { PRIORITY_FEE_FLOOR_MICROLAMPORTS as FLOOR } from "../compute-budget";
import { logEvent } from "@/lib/logging";

const RPC = "https://rpc.test/";
const accounts = [Keypair.generate().publicKey, Keypair.generate().publicKey];

function rpcResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });
}

function fakeConnection(recentFees: number[] | Error = []) {
  const getRecentPrioritizationFees = vi.fn(async () => {
    if (recentFees instanceof Error) throw recentFees;
    return recentFees.map((prioritizationFee, slot) => ({
      slot,
      prioritizationFee,
    }));
  });
  return {
    getRecentPrioritizationFees,
    connection: {
      rpcEndpoint: RPC,
      getRecentPrioritizationFees,
    } as unknown as Connection,
  };
}

beforeEach(() => {
  env.max = undefined;
  resetPriorityFeeStateForTests();
  vi.clearAllMocks();
});

describe("clampPriorityFee", () => {
  it("rounds up and holds the price between the floor and the ceiling", () => {
    expect(clampPriorityFee(123_456.2, 1_000_000)).toBe(123_457);
    expect(clampPriorityFee(0, 1_000_000)).toBe(FLOOR);
    expect(clampPriorityFee(50_000_000, 1_000_000)).toBe(1_000_000);
    expect(clampPriorityFee(Number.NaN, 1_000_000)).toBe(FLOOR);
  });

  it("lets a ceiling of 0 turn the fee off", () => {
    expect(clampPriorityFee(250_000, 0)).toBe(0);
  });
});

describe("estimatePriorityFee", () => {
  it("asks Helius for the Medium estimate on the writable accounts", async () => {
    const { connection, getRecentPrioritizationFees } = fakeConnection();
    const fetchImpl = vi.fn(async () =>
      rpcResponse({ jsonrpc: "2.0", result: { priorityFeeEstimate: 42_000.5 } })
    );

    const price = await estimatePriorityFee(connection, accounts, {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(price).toBe(42_001);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(RPC);
    expect(JSON.parse(init.body as string)).toMatchObject({
      method: "getPriorityFeeEstimate",
      params: [
        {
          accountKeys: accounts.map((a) => a.toBase58()),
          options: { priorityLevel: "Medium" },
        },
      ],
    });
    expect(getRecentPrioritizationFees).not.toHaveBeenCalled();
  });

  it("clamps the estimate to PRIORITY_FEE_MAX_MICROLAMPORTS", async () => {
    env.max = 200_000;
    const { connection } = fakeConnection();
    const fetchImpl = vi.fn(async () =>
      rpcResponse({ result: { priorityFeeEstimate: 9_000_000 } })
    );

    expect(
      await estimatePriorityFee(connection, accounts, {
        fetchImpl: fetchImpl as unknown as typeof fetch,
      })
    ).toBe(200_000);
  });

  it("uses the code default ceiling when the env var is unset", async () => {
    const { connection } = fakeConnection();
    const fetchImpl = vi.fn(async () =>
      rpcResponse({ result: { priorityFeeEstimate: 1e12 } })
    );

    expect(
      await estimatePriorityFee(connection, accounts, {
        fetchImpl: fetchImpl as unknown as typeof fetch,
      })
    ).toBe(DEFAULT_PRIORITY_FEE_MAX_MICROLAMPORTS);
  });

  it("falls back to getRecentPrioritizationFees on an RPC without the Helius method, and stops asking", async () => {
    const { connection, getRecentPrioritizationFees } = fakeConnection([
      0, 0, 5_000, 20_000, 60_000, 80_000, 90_000, 400_000,
    ]);
    const fetchImpl = vi.fn(async () =>
      rpcResponse({ error: { code: -32601, message: "Method not found" } })
    );
    const opts = { fetchImpl: fetchImpl as unknown as typeof fetch };

    // 75th percentile of the per-slot fees.
    expect(await estimatePriorityFee(connection, accounts, opts)).toBe(90_000);
    expect(getRecentPrioritizationFees).toHaveBeenCalledWith({
      lockedWritableAccounts: accounts,
    });

    await estimatePriorityFee(connection, accounts, opts);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(getRecentPrioritizationFees).toHaveBeenCalledTimes(2);
  });

  it("gives the floor on a quiet cluster (devnet answers zero)", async () => {
    const { connection } = fakeConnection([0, 0, 0]);
    const fetchImpl = vi.fn(async () =>
      rpcResponse({ result: { priorityFeeEstimate: 0 } })
    );

    expect(
      await estimatePriorityFee(connection, accounts, {
        fetchImpl: fetchImpl as unknown as typeof fetch,
      })
    ).toBe(FLOOR);
  });

  it("falls back to the floor when both estimates fail, without throwing", async () => {
    const { connection } = fakeConnection(new Error("boom"));
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });

    expect(
      await estimatePriorityFee(connection, accounts, {
        fetchImpl: fetchImpl as unknown as typeof fetch,
      })
    ).toBe(FLOOR);
    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "PRIORITY_FEE_001",
        context: expect.objectContaining({ reason: "rpc_error" }),
      })
    );
    // The logged context never carries the error text (it can hold the URL).
    expect(JSON.stringify(vi.mocked(logEvent).mock.calls)).not.toContain(
      "fetch failed"
    );
  });

  it("falls back to the floor when the RPC doesn't answer in time", async () => {
    const { connection } = fakeConnection();
    const fetchImpl = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new Error("aborted"))
          );
        })
    );

    expect(
      await estimatePriorityFee(connection, accounts, {
        fetchImpl: fetchImpl as unknown as typeof fetch,
        timeoutMs: 20,
      })
    ).toBe(FLOOR);
    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({ reason: "timeout" }),
      })
    );
  });

  it("keeps the fallback under a ceiling below the floor", async () => {
    env.max = 0;
    const { connection } = fakeConnection(new Error("boom"));
    const fetchImpl = vi.fn(async () => {
      throw new Error("down");
    });

    expect(
      await estimatePriorityFee(connection, accounts, {
        fetchImpl: fetchImpl as unknown as typeof fetch,
      })
    ).toBe(0);
  });
});
