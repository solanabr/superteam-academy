import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export interface AuthorIdentity {
  username: string | null;
  avatar_url: string | null;
}

export interface CommunityAuthor extends AuthorIdentity {
  level: number;
}

/**
 * Resolve author identities (username/avatar) for a set of author ids via the
 * public_profiles view.
 *
 * #493: the base profiles table is no longer cross-user readable, so the former
 * `author:profiles!author_id(...)` PostgREST embed — which resolves the join
 * under the CALLER's RLS on profiles — returned null for every author but the
 * caller. public_profiles has no declared FK, so it can't be auto-embedded;
 * callers batch-fetch here (keyed by author id) and merge with levels from
 * public_user_xp. Authors whose profile is private or missing are simply absent
 * from the map and render as the anonymous fallback.
 */
export async function fetchAuthorProfiles(
  supabase: SupabaseClient<Database>,
  authorIds: string[]
): Promise<Record<string, AuthorIdentity>> {
  if (authorIds.length === 0) return {};
  const { data } = await supabase
    .from("public_profiles")
    .select("id, username, avatar_url")
    .in("id", authorIds);
  if (!data) return {};
  return Object.fromEntries(
    data.map((p) => [
      p.id ?? "",
      { username: p.username, avatar_url: p.avatar_url },
    ])
  );
}

/** Merge a resolved identity with the author's level into the response shape
 *  the community UI expects (`author.username || anonymous`, `author.level`). */
export function buildAuthor(
  authorId: string,
  profiles: Record<string, AuthorIdentity>,
  levels: Record<string, number>
): CommunityAuthor {
  const identity = profiles[authorId];
  return {
    username: identity?.username ?? null,
    avatar_url: identity?.avatar_url ?? null,
    level: levels[authorId] || 0,
  };
}
