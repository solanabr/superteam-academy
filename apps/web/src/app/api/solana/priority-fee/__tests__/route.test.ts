/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { Keypair } from "@solana/web3.js";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => ({
  getClaims: vi.fn(),
  isRateLimited: vi.fn(),
  estimate: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getClaims: h.getClaims } }),
}));
vi.mock("@/lib/rate-limit", () => ({ isRateLimited: h.isRateLimited }));
vi.mock("@/lib/solana/academy-program", () => ({
  getConnection: () => ({ rpcEndpoint: "https://rpc.test" }),
}));
vi.mock("@/lib/solana/priority-fee", () => ({
  estimatePriorityFee: h.estimate,
}));
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));

import { POST } from "../route";

const accounts = [
  Keypair.generate().publicKey.toBase58(),
  Keypair.generate().publicKey.toBase58(),
];

function post(body: unknown) {
  return new NextRequest("http://localhost/api/solana/priority-fee", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  h.getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } } });
  h.isRateLimited.mockResolvedValue(false);
  h.estimate.mockResolvedValue(42_000);
});

describe("POST /api/solana/priority-fee", () => {
  it("returns the server's clamped estimate for the given accounts", async () => {
    const res = await POST(post({ accounts }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ microLamports: 42_000 });
    const [, keys] = h.estimate.mock.calls[0] as [
      unknown,
      { toBase58(): string }[],
    ];
    expect(keys.map((k) => k.toBase58())).toEqual(accounts);
    expect(h.isRateLimited).toHaveBeenCalledWith(
      "solana:priority-fee",
      "user-1",
      expect.objectContaining({ failClosed: true })
    );
  });

  it("refuses without a session", async () => {
    h.getClaims.mockResolvedValue({ data: null });

    const res = await POST(post({ accounts }));

    expect(res.status).toBe(401);
    expect(h.estimate).not.toHaveBeenCalled();
  });

  it.each([
    ["no accounts", {}],
    ["an empty list", { accounts: [] }],
    ["a bad address", { accounts: ["not-a-key"] }],
    ["a non-string", { accounts: [42] }],
    ["too many", { accounts: Array.from({ length: 17 }, () => accounts[0]) }],
  ])("rejects %s", async (_label, body) => {
    const res = await POST(post(body));

    expect(res.status).toBe(400);
    expect(h.estimate).not.toHaveBeenCalled();
  });

  it("rate limits per user", async () => {
    h.isRateLimited.mockResolvedValue(true);

    const res = await POST(post({ accounts }));

    expect(res.status).toBe(429);
    expect(h.estimate).not.toHaveBeenCalled();
  });
});
