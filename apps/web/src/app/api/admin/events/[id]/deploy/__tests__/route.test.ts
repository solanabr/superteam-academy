/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
// The event row must end up matching the on-chain achievement type: a
// redemption mints what's on-chain, and the redeem page and NFT metadata show
// what's in the row.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => ({
  event: null as Record<string, unknown> | null,
  update: vi.fn(),
  accountExists: false,
  decoded: null as Record<string, unknown> | null,
  deploy: vi.fn(),
}));

vi.mock("@/lib/admin/auth", () => ({
  AdminAuthError: class extends Error {},
  adminUnauthorizedResponse: () => new Response("{}", { status: 401 }),
  requireAdminAuth: async () => ({ userId: "admin-1" }),
}));
vi.mock("@/lib/env.server", () => ({
  serverEnv: { SOLANA_RPC_URL: "http://127.0.0.1:8899" },
}));
vi.mock("@/lib/platform/freeze", () => ({
  isPlatformFrozen: async () => false,
}));
vi.mock("@/lib/platform/freeze-http", () => ({
  platformFrozenResponse: () => new Response("{}", { status: 503 }),
}));
vi.mock("@/lib/metadata/pinned-uri", () => ({
  eventMetadataUri: (id: string) =>
    `https://app.test/api/events/metadata/${id}`,
}));
vi.mock("@/lib/solana/pda", () => ({
  getProgramId: () => "Prog",
  findAchievementTypePDA: () => ["Pda"],
}));
vi.mock("@solana/web3.js", () => ({
  Connection: class {
    async getAccountInfo() {
      return h.accountExists ? {} : null;
    }
  },
  PublicKey: class {
    constructor(private v: unknown) {}
    toBase58() {
      return String(this.v);
    }
  },
}));
vi.mock("@/lib/solana/academy-reads", () => ({
  fetchAchievementType: async () => h.decoded,
}));
vi.mock("@/lib/solana/admin-signer", () => ({
  deployAchievementType: h.deploy,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "event_attendances") {
        return {
          select: () => ({ eq: async () => ({ count: 3 }) }),
        };
      }
      return {
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: h.event }) }),
        }),
        update: (values: Record<string, unknown>) => {
          h.update(values);
          return {
            eq: () => ({
              select: () => ({
                single: async () => ({
                  data: { ...h.event, ...values },
                  error: null,
                }),
              }),
            }),
          };
        },
      };
    },
  }),
}));

import { POST } from "../route";

const ctx = { params: Promise.resolve({ id: "evt-1" }) };
const req = () =>
  new NextRequest("https://app.test/api/admin/events/evt-1/deploy", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.event = {
    id: "evt-1",
    achievement_id: "event-breakpoint-ab12c",
    name: "Breakpoint",
    description: "",
    image_url: null,
    xp_reward: 100,
    code: "ABCD-1234",
    starts_at: "2026-11-20T18:00:00.000Z",
    ends_at: "2026-11-20T22:00:00.000Z",
    created_at: "2026-11-12T00:00:00.000Z",
    collection_address: null,
    deploy_tx: null,
    deployed_at: null,
  };
  h.accountExists = false;
  h.decoded = null;
  h.deploy.mockResolvedValue({
    success: true,
    signature: "sig",
    collectionAddress: "Co11",
  });
});

describe("POST /api/admin/events/:id/deploy", () => {
  it("deploys the type and writes back what it sent", async () => {
    const res = await POST(req(), ctx);
    expect(res.status).toBe(200);
    expect(h.deploy).toHaveBeenCalledWith(
      expect.objectContaining({
        achievementId: "event-breakpoint-ab12c",
        name: "Breakpoint",
        xpReward: 100,
        maxSupply: 0,
        metadataUri:
          "https://app.test/api/events/metadata/event-breakpoint-ab12c",
      })
    );
    expect(h.update).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Breakpoint",
        xp_reward: 100,
        collection_address: "Co11",
        deploy_tx: "sig",
      })
    );
  });

  it("adopts the on-chain name and XP when the type already exists", async () => {
    // A send that timed out but landed, after an edit changed the row's XP.
    h.event = { ...h.event!, xp_reward: 500 };
    h.accountExists = true;
    h.decoded = { collection: "Co11", name: "Breakpoint", xp_reward: 100 };

    const res = await POST(req(), ctx);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ action: "recovered" });
    expect(h.deploy).not.toHaveBeenCalled();
    expect(h.update).toHaveBeenCalledWith(
      expect.objectContaining({ xp_reward: 100, collection_address: "Co11" })
    );
  });

  it("reports a failed deploy without marking the event deployed", async () => {
    h.deploy.mockResolvedValue({ success: false, error: "boom" });
    const res = await POST(req(), ctx);
    expect(res.status).toBe(500);
    expect(h.update).not.toHaveBeenCalled();
  });

  it("does nothing for an event that's already deployed", async () => {
    h.event = { ...h.event!, collection_address: "Co11" };
    const res = await POST(req(), ctx);
    await expect(res.json()).resolves.toMatchObject({ action: "noop" });
    expect(h.deploy).not.toHaveBeenCalled();
  });
});
