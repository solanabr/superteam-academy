/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const rpc = vi.hoisted(() => ({ url: "https://api.devnet.solana.com" }));
const { getAccountInfo, deployAchievementType } = vi.hoisted(() => ({
  getAccountInfo: vi.fn(),
  deployAchievementType: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/env.server", () => ({
  serverEnv: {
    get SOLANA_RPC_URL() {
      return rpc.url;
    },
  },
}));
vi.mock("@/lib/admin/auth", () => ({
  requireAdminAuth: vi.fn(() => ({ userId: "admin-user-1" })),
  adminUnauthorizedResponse: vi.fn(),
  AdminAuthError: class AdminAuthError extends Error {},
}));
vi.mock("@/lib/platform/freeze", () => ({
  isPlatformFrozen: vi.fn().mockResolvedValue(false),
}));
vi.mock("@/lib/platform/freeze-http", () => ({
  platformFrozenResponse: vi.fn(),
}));
vi.mock("@/lib/content/queries", () => ({
  COURSES_CACHE_TAG: "courses",
  getAllAchievementsAdmin: vi.fn().mockResolvedValue([
    {
      _id: "achievement-first-steps",
      name: "First Steps",
      category: "progress",
      xpReward: 25,
      maxSupply: 0,
      onChainStatus: null,
      award: null,
    },
  ]),
}));
vi.mock("@/lib/solana/academy-reads", () => ({
  fetchAchievementType: vi.fn(),
}));
vi.mock("@/lib/solana/admin-signer", () => ({ deployAchievementType }));
vi.mock("@/lib/content/deployment-writes", () => ({
  writeAchievementOnChainStatus: vi.fn(),
}));
vi.mock("@solana/web3.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@solana/web3.js")>();
  return {
    ...actual,
    Connection: class {
      getAccountInfo = getAccountInfo;
    },
  };
});

import { POST } from "../route";

function syncRequest(): NextRequest {
  return new NextRequest("https://app.test/api/admin/achievements/sync", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ achievementId: "achievement-first-steps" }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  rpc.url = "https://api.devnet.solana.com";
  getAccountInfo.mockResolvedValue(null);
  deployAchievementType.mockResolvedValue({
    success: true,
    signature: "SIG",
    collectionAddress: undefined,
  });
});

describe("POST /api/admin/achievements/sync — metadata URI", () => {
  it("refuses before sending anything when the origin can't be pinned", async () => {
    // NEXT_PUBLIC_APP_URL is http://localhost:3000 in the test env.
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(syncRequest());
    expect(res.status).toBe(500);
    expect(((await res.json()) as { error: string }).error).toMatch(
      /loopback origin/
    );
    expect(deployAchievementType).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it("writes the canonical path on the app origin, never content's URI", async () => {
    rpc.url = "http://127.0.0.1:8899"; // a local validator may pin localhost
    const res = await POST(syncRequest());
    expect(res.status).toBe(200);
    expect(deployAchievementType).toHaveBeenCalledWith(
      expect.objectContaining({
        metadataUri:
          "http://localhost:3000/api/achievements/metadata/achievement-first-steps",
      })
    );
  });
});
