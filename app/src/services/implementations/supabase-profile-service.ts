import type { ProfileService } from "../profile-service";
import type { UserProfile } from "@/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function rowToProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    walletAddress: (row.wallet_address as string) ?? null,
    email: (row.email as string) ?? null,
    username: (row.username as string) ?? (row.id as string).slice(0, 8),
    displayName: (row.display_name as string) ?? "Learner",
    bio: (row.bio as string) ?? "",
    avatarUrl: (row.avatar_url as string) ?? null,
    socialLinks:
      (row.social_links as UserProfile["socialLinks"]) ?? {},
    joinedAt: row.created_at as string,
    isPublic: (row.is_public as boolean) ?? true,
    preferredLanguage: (row.preferred_language as string) ?? "en",
    theme: ((row.theme as string) ?? "light") as UserProfile["theme"],
    onboardingCompleted: (row.onboarding_completed as boolean) ?? false,
  };
}

export const supabaseProfileService: ProfileService = {
  async getProfile(userId) {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    return data ? rowToProfile(data) : null;
  },

  async getProfileByUsername(username) {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single();

    return data ? rowToProfile(data) : null;
  },

  async getProfileByWallet(walletAddress) {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("wallet_address", walletAddress)
      .single();

    return data ? rowToProfile(data) : null;
  },

  async updateProfile(userId, updates) {
    const supabase = createSupabaseBrowserClient();

    const dbUpdates: Record<string, unknown> = {};
    if (updates.username !== undefined) dbUpdates.username = updates.username;
    if (updates.displayName !== undefined)
      dbUpdates.display_name = updates.displayName;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.avatarUrl !== undefined)
      dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.socialLinks !== undefined)
      dbUpdates.social_links = updates.socialLinks;
    if (updates.isPublic !== undefined) dbUpdates.is_public = updates.isPublic;
    if (updates.preferredLanguage !== undefined)
      dbUpdates.preferred_language = updates.preferredLanguage;
    if (updates.theme !== undefined) dbUpdates.theme = updates.theme;

    const { data, error } = await supabase
      .from("profiles")
      .update(dbUpdates)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return rowToProfile(data);
  },
};
