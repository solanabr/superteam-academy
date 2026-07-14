import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";

// #461 — refuse login for soft-deleted accounts. Shared by the two login
// chokepoints: /api/auth/callback (OAuth) and middleware.ts (the backstop
// that also covers SIWS/wallet sessions, which never pass through the OAuth
// callback route).

/**
 * Query-string `reason` value both chokepoints attach to the landing-page
 * redirect (`?error=auth&reason=account_deleted`) when a tombstoned account
 * tries to sign back in. `AuthErrorToast` maps this to the localized
 * `auth.accountDeleted` message.
 */
export const DELETED_ACCOUNT_REASON = "account_deleted";

/**
 * True when `profiles.deleted_at` is set for this user id — i.e. the account
 * was soft-deleted by POST /api/account/delete and must be refused at login.
 *
 * Uses the admin (service-role) client rather than a session-bound one. The
 * account-deletion migration (20260704140000_account_deletion.sql)
 * intentionally left the own-row SELECT policy untouched (`auth.uid() = id`,
 * no `deleted_at` guard) so a just-deleted user's /settings page keeps
 * loading — so that policy cannot be relied on here to answer "should this
 * session be allowed to exist." The admin client makes the check independent
 * of RLS policy shape.
 *
 * Fails OPEN (returns false) on any query error: this runs on the hot path of
 * every authenticated request (middleware) and every OAuth callback, so a
 * transient Supabase hiccup must not lock every legitimate user out of the
 * platform. Errors are logged for visibility.
 */
export async function isAccountDeleted(userId: string): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("deleted_at")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;
    return data?.deleted_at != null;
  } catch (err) {
    logError({
      errorId: ERROR_IDS.DELETED_ACCOUNT_CHECK_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { userId },
    });
    return false;
  }
}
