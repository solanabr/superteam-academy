import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * Revoke every session of a user by permanently banning the account.
 *
 * GoTrue refuses banned users at token refresh, so all refresh tokens die and
 * only the current access token's remaining lifetime survives — the same
 * <= JWT-expiry bound the account-deletion flow accepts. supabase-js exposes
 * no revoke-by-user-id, which is why this is a ban and not a logout.
 *
 * INVARIANT (#1089): middleware no longer checks profiles.deleted_at
 * per-request, so EVERY writer of deleted_at must pair with a successful call
 * to this helper (or a global signOut). A silent failure here is an unbounded
 * zombie session — hence the retries; callers must still check the result and
 * escalate loudly on false.
 */
export async function revokeUserSessions(
  admin: SupabaseClient<Database>,
  userId: string,
  attempts = 3
): Promise<{ ok: boolean; error: Error | null }> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
    }
    const { error } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: "876600h",
    });
    if (!error) return { ok: true, error: null };
    lastError = new Error(error.message);
  }
  return { ok: false, error: lastError };
}
