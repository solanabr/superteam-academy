/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Connection } from "@solana/web3.js";

const h = vi.hoisted(() => ({
  settle: vi.fn(),
  balances: vi.fn(),
  logEvent: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/logging", () => ({ logEvent: h.logEvent }));
vi.mock("../settle", () => ({
  settlePendingSpend: h.settle,
  defaultSettleDeps: () => ({ now: Date.now }),
}));
vi.mock("../balance-check", () => ({
  checkPlatformBalances: h.balances,
  defaultBalanceCheckDeps: () => ({}),
}));

import { runSpendUpkeep } from "../upkeep";

const connection = {} as Connection;
const settled = { checked: 1, confirmed: 1, failed: 0, expired: 0, pending: 0 };
const balances = { checked: 2, snapshots: 0, alerts: 0 };

beforeEach(() => {
  vi.clearAllMocks();
  h.settle.mockResolvedValue(settled);
  h.balances.mockResolvedValue(balances);
});

describe("runSpendUpkeep", () => {
  it("settles, then checks balances, and gives settlement a deadline inside the budget", async () => {
    const before = Date.now();
    const summary = await runSpendUpkeep(connection, 10_000);

    expect(summary).toEqual({ settled, balances, timedOut: false });
    const deps = h.settle.mock.calls[0]?.[1] as { deadline: number };
    expect(deps.deadline).toBeGreaterThanOrEqual(before + 8_000);
    expect(deps.deadline).toBeLessThanOrEqual(Date.now() + 8_000);
  });

  it("gives up at the budget when an RPC call hangs, so the drain still runs", async () => {
    h.settle.mockReturnValue(new Promise(() => undefined));

    const started = Date.now();
    const summary = await runSpendUpkeep(connection, 50);

    expect(Date.now() - started).toBeLessThan(1_000);
    expect(summary.timedOut).toBe(true);
    expect(summary.settled).toBeNull();
    expect(h.logEvent.mock.calls[0]?.[0]).toMatchObject({
      event: "SPEND_LEDGER_004",
    });
  });

  it("still checks balances when settlement fails", async () => {
    h.settle.mockRejectedValue(new Error("platform_spend read failed"));

    const summary = await runSpendUpkeep(connection, 10_000);

    expect(summary.settled).toBeNull();
    expect(summary.balances).toEqual(balances);
    expect(summary.timedOut).toBe(false);
  });
});
