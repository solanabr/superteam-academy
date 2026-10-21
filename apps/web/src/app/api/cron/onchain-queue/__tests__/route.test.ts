/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({
  calls: [] as string[],
  drain: vi.fn(),
  upkeep: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env.server", () => ({
  serverEnv: { CRON_SECRET: "s3cret-value" },
}));
vi.mock("@/lib/solana/onchain-queue", () => ({
  drainAllPendingOnchainActions: h.drain,
}));
vi.mock("@/lib/solana/academy-program", () => ({
  getConnection: () => ({ rpcEndpoint: "conn" }),
}));
vi.mock("@/lib/platform-spend/upkeep", () => ({ runSpendUpkeep: h.upkeep }));

import { GET } from "../route";

const request = (authorization?: string) =>
  new NextRequest("http://localhost/api/cron/onchain-queue", {
    headers: authorization ? { authorization } : {},
  });

beforeEach(() => {
  h.calls.length = 0;
  process.env.NEXT_PUBLIC_APP_URL = "https://app.test";
  h.drain.mockImplementation(async () => {
    h.calls.push("drain");
    return { selected: 1, users: 1, attempted: 1 };
  });
  h.upkeep.mockImplementation(async () => {
    h.calls.push("upkeep");
    return {
      settled: { checked: 2, confirmed: 2, failed: 0, expired: 0, pending: 0 },
      balances: { checked: 2, snapshots: 2, alerts: 0 },
    };
  });
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/cron/onchain-queue", () => {
  it("refuses a caller without the cron secret: no drain, no spend upkeep", async () => {
    const res = await GET(request("Bearer wrong"));
    expect(res.status).toBe(401);
    expect(h.drain).not.toHaveBeenCalled();
    expect(h.upkeep).not.toHaveBeenCalled();
  });

  it("drains first, then settles spend and checks balances", async () => {
    const res = await GET(request("Bearer s3cret-value"));

    expect(res.status).toBe(200);
    expect(h.calls).toEqual(["drain", "upkeep"]);
    await expect(res.json()).resolves.toMatchObject({
      job: "onchain-queue",
      attempted: 1,
      spend: { settled: { confirmed: 2 }, balances: { snapshots: 2 } },
    });
  });
});
