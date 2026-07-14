/* eslint-disable import/order -- vi.mock calls must precede importing the route. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { GET } from "../route";

const WALLET = "B7o8NfV81HzjuZFWQTTx3Xdvh77Dqoajwib3kWEnvzJF";

function req(path: string): NextRequest {
  return new NextRequest(`http://localhost${path}`);
}

/** Chainable Supabase query stub: `.from().select().eq().maybeSingle()`. */
function stubSupabase(row: Record<string, unknown> | null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return { from, select, eq, maybeSingle };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/content/instructor-wallet", () => {
  it("resolves the wallet's public profile — reading the public_profiles VIEW, not the raw profiles table", async () => {
    const stub = stubSupabase({
      username: "alice",
      avatar_url: "https://example.com/a.png",
      bio: "Rust developer",
      social_links: { twitter: "alice_dev" },
    });
    createClientMock.mockResolvedValue({ from: stub.from });

    const res = await GET(
      req(`/api/content/instructor-wallet?wallet=${WALLET}`)
    );

    expect(await res.json()).toEqual({
      profile: {
        username: "alice",
        avatarUrl: "https://example.com/a.png",
        bio: "Rust developer",
        socialLinks: { twitter: "alice_dev" },
      },
    });
    // CRITICAL: must query public_profiles, never the raw profiles table.
    expect(stub.from).toHaveBeenCalledWith("public_profiles");
    expect(stub.from).not.toHaveBeenCalledWith("profiles");
    expect(stub.eq).toHaveBeenCalledWith("wallet_address", WALLET);
  });

  it("returns profile: null when the wallet has no public profile", async () => {
    const stub = stubSupabase(null);
    createClientMock.mockResolvedValue({ from: stub.from });

    const res = await GET(
      req(`/api/content/instructor-wallet?wallet=${WALLET}`)
    );

    expect(await res.json()).toEqual({ profile: null });
    expect(stub.from).toHaveBeenCalledWith("public_profiles");
  });

  it("400s on a missing or non-base58 wallet", async () => {
    expect((await GET(req("/api/content/instructor-wallet"))).status).toBe(400);
    expect(
      (
        await GET(
          req("/api/content/instructor-wallet?wallet=not-a-wallet-0OIl")
        )
      ).status
    ).toBe(400);
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("500s with a generic message on failure (no stack trace leak)", async () => {
    createClientMock.mockRejectedValue(new Error("boom secret detail"));
    const res = await GET(
      req(`/api/content/instructor-wallet?wallet=${WALLET}`)
    );
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("secret detail");
  });
});
