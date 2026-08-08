import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/** Non-sensitive social handles a profile may set (settings page shape). */
export interface SocialLinks {
  twitter?: string;
  github?: string;
  discord?: string;
}

/**
 * The identity fields the `public_profiles` view exposes for a wallet — what
 * instructor-identity display resolves to (issue #478, B4). `null` means no
 * public, non-deleted profile is linked to this wallet (no profile yet,
 * private, or deleted); callers fall back to a truncated wallet, never a
 * blank UI.
 */
export interface PublicProfile {
  username: string;
  /**
   * Editorial name shown INSTEAD of `username` (#997). Admin-set, so it is safe
   * to present as the author's real identity. `null` falls back to `username`.
   * Never used for routing — usernames are unique and route-safe, display names
   * are neither.
   */
  displayName: string | null;
  /** Admin-granted verified-teacher badge (#997). */
  verified: boolean;
  avatarUrl: string | null;
  bio: string | null;
  socialLinks: SocialLinks | null;
}

/** The name to show for a profile: editorial name first, generated one second. */
export function profileDisplayName(profile: PublicProfile): string {
  return profile.displayName?.trim() || profile.username;
}

/**
 * Resolve a wallet to its public academy profile via the `public_profiles`
 * VIEW — never the raw `profiles` table, which carries sensitive columns
 * (`google_id`, `github_id`, `deleted_at`, …) under owner-only RLS. The view
 * is the security boundary here: it pre-filters to public, non-deleted,
 * wallet-linked rows and exposes exactly `wallet_address, username,
 * avatar_url, bio, social_links`
 * (supabase/migrations/20260714130000_public_profiles_view.sql).
 *
 * Takes a `SupabaseClient` rather than constructing one, so this is the ONE
 * resolution path shared by every caller — the course-detail page (server
 * component) and `/api/content/instructor-wallet` both call this function,
 * each with their own client instance.
 */
export async function resolvePublicProfileByWallet(
  supabase: SupabaseClient<Database>,
  wallet: string
): Promise<PublicProfile | null> {
  const { data } = await supabase
    .from("public_profiles")
    .select("username, display_name, verified, avatar_url, bio, social_links")
    .eq("wallet_address", wallet)
    .maybeSingle();

  if (!data?.username) return null;

  return {
    username: data.username,
    // `?? null`, not a bare passthrough: an absent column reads as `undefined`,
    // which would make PublicProfile's `string | null` a lie for consumers.
    displayName: data.display_name ?? null,
    // Default false rather than trusting a nullable read: an unverified teacher
    // wrongly badged is worse than a verified one briefly unbadged.
    verified: data.verified ?? false,
    avatarUrl: data.avatar_url,
    bio: data.bio,
    socialLinks: (data.social_links as SocialLinks | null) ?? null,
  };
}
