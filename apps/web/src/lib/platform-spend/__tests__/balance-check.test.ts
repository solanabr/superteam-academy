/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi } from "vitest";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({}) }));
vi.mock("@/lib/env.server", () => ({ serverEnv: {} }));
vi.mock("@/lib/community/moderation-notify", () => ({
  notifyModeration: vi.fn(),
}));
vi.mock("@/lib/solana/sponsor", () => ({
  getSponsorKeypair: () => null,
  parseKeypairSecret: vi.fn(),
  spendCluster: () => "devnet",
}));
vi.mock("@/lib/analytics/server-capture", () => ({
  captureServerEvent: vi.fn(),
  PLATFORM_DISTINCT_ID: "platform",
}));
vi.mock("@/lib/logging", () => ({ logEvent: vi.fn() }));

import {
  checkPlatformBalances,
  LOW_BALANCE_ALERT_INTERVAL_S,
  SNAPSHOT_INTERVAL_S,
  type BalanceCheckDeps,
} from "../balance-check";
import type { ServerEvent } from "../events";

const sponsor = Keypair.generate().publicKey;
const backend = Keypair.generate().publicKey;

/**
 * The real throttle is `claim_platform_alert` (exercised against Postgres in
 * the migration's execution test). This fake keeps the same contract on a
 * controllable clock: a key fires when it never fired, or fired at least
 * `minIntervalSeconds` ago.
 */
function throttle(clock: { now: number }) {
  const lastFired = new Map<string, number>();
  return vi.fn(async (key: string, minIntervalSeconds: number) => {
    const last = lastFired.get(key);
    if (last !== undefined && clock.now - last < minIntervalSeconds * 1000) {
      return false;
    }
    lastFired.set(key, clock.now);
    return true;
  });
}

function makeDeps(
  balances: Record<string, number>,
  overrides: Partial<BalanceCheckDeps> = {}
) {
  const clock = { now: 0 };
  const events: ServerEvent[] = [];
  const notify = vi.fn(async (_message: string) => undefined);
  const deps: BalanceCheckDeps = {
    connection: {
      getBalance: vi.fn(async (pubkey) => balances[pubkey.toBase58()] ?? 0),
    },
    wallets: [
      { role: "sponsor", pubkey: sponsor },
      { role: "backend", pubkey: backend },
    ],
    cluster: "devnet",
    thresholdLamports: 2 * LAMPORTS_PER_SOL,
    claim: throttle(clock),
    emit: async (event) => {
      events.push(event);
    },
    notify,
    ...overrides,
  };
  return { deps, clock, events, notify };
}

const healthy = {
  [sponsor.toBase58()]: 10 * LAMPORTS_PER_SOL,
  [backend.toBase58()]: 10 * LAMPORTS_PER_SOL,
};

describe("balance snapshots", () => {
  it("sends one snapshot per wallet, then at most one per hour", async () => {
    const { deps, clock, events } = makeDeps(healthy);
    const snapshots = () =>
      events.filter((e) => e.event === "sponsor_balance_snapshot");

    await checkPlatformBalances(deps);
    expect(snapshots()).toHaveLength(2);

    // The 15-minute cron ticks three more times inside the hour.
    for (const minutes of [15, 30, 45]) {
      clock.now = minutes * 60_000;
      await checkPlatformBalances(deps);
    }
    expect(snapshots()).toHaveLength(2);

    clock.now = 60 * 60_000;
    await checkPlatformBalances(deps);
    expect(snapshots()).toHaveLength(4);
  });

  it("carries the role, balance and cluster, and no wallet address", async () => {
    const { deps, events } = makeDeps(healthy);
    await checkPlatformBalances(deps);

    expect(events[0]).toEqual({
      event: "sponsor_balance_snapshot",
      distinctId: "platform",
      properties: {
        payer_role: "sponsor",
        balance_lamports: 10 * LAMPORTS_PER_SOL,
        cluster: "devnet",
      },
    });
    expect(JSON.stringify(events)).not.toContain(sponsor.toBase58());
    expect(JSON.stringify(events)).not.toContain(backend.toBase58());
  });

  it("uses an interval just under an hour so a slightly early tick still fires", () => {
    expect(SNAPSHOT_INTERVAL_S).toBeLessThan(3600);
    expect(SNAPSHOT_INTERVAL_S).toBeGreaterThan(45 * 60);
  });
});

describe("low-balance alert", () => {
  const low = {
    ...healthy,
    [sponsor.toBase58()]: 1 * LAMPORTS_PER_SOL,
  };

  it("alerts through the ops webhook and PostHog when a wallet is under the threshold", async () => {
    const { deps, events, notify } = makeDeps(low);

    const summary = await checkPlatformBalances(deps);

    expect(summary.alerts).toBe(1);
    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify.mock.calls[0]?.[0]).toMatch(/sponsor wallet on devnet/);
    expect(events.find((e) => e.event === "sponsor_low_balance")).toEqual({
      event: "sponsor_low_balance",
      distinctId: "platform",
      properties: {
        payer_role: "sponsor",
        balance_lamports: 1 * LAMPORTS_PER_SOL,
        threshold_lamports: 2 * LAMPORTS_PER_SOL,
        cluster: "devnet",
      },
    });
  });

  it("does not repeat the alert every tick: at most once per interval", async () => {
    const { deps, clock, notify } = makeDeps(low);

    for (let tick = 0; tick < 16; tick++) {
      clock.now = tick * 15 * 60_000; // four hours of cron ticks
      await checkPlatformBalances(deps);
    }
    expect(notify).toHaveBeenCalledTimes(1);

    clock.now = LOW_BALANCE_ALERT_INTERVAL_S * 1000;
    await checkPlatformBalances(deps);
    expect(notify).toHaveBeenCalledTimes(2);
  });

  it("stays quiet without a threshold, and when balances are healthy", async () => {
    const unset = makeDeps(low, { thresholdLamports: null });
    await checkPlatformBalances(unset.deps);
    expect(unset.notify).not.toHaveBeenCalled();

    const fine = makeDeps(healthy);
    await checkPlatformBalances(fine.deps);
    expect(fine.notify).not.toHaveBeenCalled();
  });

  it("stays quiet when the throttle cannot be claimed (DB error)", async () => {
    const { deps, notify, events } = makeDeps(low, {
      claim: vi.fn(async () => false),
    });
    await checkPlatformBalances(deps);
    expect(notify).not.toHaveBeenCalled();
    expect(events).toHaveLength(0);
  });

  it("skips a wallet whose balance can't be read without failing the others", async () => {
    const { deps, events } = makeDeps(healthy, {
      connection: {
        getBalance: vi.fn(async (pubkey) => {
          if (pubkey.equals(sponsor)) throw new Error("rpc down");
          return 10 * LAMPORTS_PER_SOL;
        }),
      },
    });

    const summary = await checkPlatformBalances(deps);

    expect(summary.checked).toBe(1);
    expect(events.map((e) => e.properties.payer_role)).toEqual(["backend"]);
  });
});
