import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const rpc = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc }),
}));

import {
  spendAssist,
  getAssistsUsed,
  MAX_PAID_ASSISTS,
} from "../assist-budget";

beforeEach(() => rpc.mockReset());

describe("assist-budget", () => {
  it("returns the RPC verdict when it succeeds", async () => {
    rpc.mockResolvedValue({ data: [{ allowed: true, used: 2 }], error: null });
    await expect(spendAssist("u", "l")).resolves.toEqual({
      allowed: true,
      used: 2,
    });
  });

  it("FAILS CLOSED when the RPC errors", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "db down" } });
    await expect(spendAssist("u", "l")).resolves.toEqual({
      allowed: false,
      used: MAX_PAID_ASSISTS,
    });
  });

  it("FAILS CLOSED when the RPC throws", async () => {
    rpc.mockRejectedValueOnce(new Error("network"));
    await expect(spendAssist("u", "l")).resolves.toEqual({
      allowed: false,
      used: MAX_PAID_ASSISTS,
    });
  });

  it("getAssistsUsed returns MAX on error (shows exhausted, not full)", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "x" } });
    await expect(getAssistsUsed("u", "l")).resolves.toBe(MAX_PAID_ASSISTS);
  });
});
