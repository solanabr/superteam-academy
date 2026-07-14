import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolvePublicProfileByWallet } from "../public-profile";
import type { Database } from "@/lib/supabase/types";

const WALLET = "B7o8NfV81HzjuZFWQTTx3Xdvh77Dqoajwib3kWEnvzJF";

/** Chainable Supabase query stub: `.from().select().eq().maybeSingle()`. */
function stubSupabase(row: Record<string, unknown> | null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return {
    client: { from } as unknown as SupabaseClient<Database>,
    from,
    select,
    eq,
  };
}

describe("resolvePublicProfileByWallet", () => {
  it("returns the profile for a wallet with a public profile, reading public_profiles by wallet_address", async () => {
    const { client, from, select, eq } = stubSupabase({
      username: "alice",
      avatar_url: "https://example.com/a.png",
      bio: "Rust developer",
      social_links: { twitter: "alice_dev" },
    });

    const profile = await resolvePublicProfileByWallet(client, WALLET);

    expect(from).toHaveBeenCalledWith("public_profiles");
    expect(select).toHaveBeenCalledWith(
      "username, avatar_url, bio, social_links"
    );
    expect(eq).toHaveBeenCalledWith("wallet_address", WALLET);
    expect(profile).toEqual({
      username: "alice",
      avatarUrl: "https://example.com/a.png",
      bio: "Rust developer",
      socialLinks: { twitter: "alice_dev" },
    });
  });

  it("returns null when no public profile row is found (no profile / private / deleted)", async () => {
    const { client } = stubSupabase(null);
    const profile = await resolvePublicProfileByWallet(client, WALLET);
    expect(profile).toBeNull();
  });

  it("normalizes null avatar/bio/social_links rather than throwing", async () => {
    const { client } = stubSupabase({
      username: "bob",
      avatar_url: null,
      bio: null,
      social_links: null,
    });
    const profile = await resolvePublicProfileByWallet(client, WALLET);
    expect(profile).toEqual({
      username: "bob",
      avatarUrl: null,
      bio: null,
      socialLinks: null,
    });
  });
});
