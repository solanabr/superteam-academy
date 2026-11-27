import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

export interface AuthorIdentity {
  username: string | null;
  avatar_url: string | null;
  /** A deleted account, as opposed to a private profile. */
  deleted: boolean;
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
 *
 * The view hides private and deleted profiles alike, so deleted authors are asked
 * for separately. Only their ids are read, and the UI shows them as "deleted user".
 * If that read fails they fall back to the anonymous label.
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
  const profiles: Record<string, AuthorIdentity> = Object.fromEntries(
    (data ?? []).map((p) => [
      p.id ?? "",
      { username: p.username, avatar_url: p.avatar_url, deleted: false },
    ])
  );

  const hidden = authorIds.filter((id) => !profiles[id]);
  if (hidden.length === 0) return profiles;
  try {
    const { data: deleted } = await createAdminClient()
      .from("profiles")
      .select("id")
      .in("id", hidden)
      .not("deleted_at", "is", null);
    for (const { id } of deleted ?? []) {
      profiles[id] = { username: null, avatar_url: null, deleted: true };
    }
  } catch {
    // A label isn't worth failing a public read over.
  }
  return profiles;
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
    deleted: identity?.deleted ?? false,
    level: levels[authorId] || 0,
  };
}
