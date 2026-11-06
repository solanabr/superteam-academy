import "server-only";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isRateLimited } from "@/lib/rate-limit";
import { revokeUserSessions } from "@/lib/auth/revoke-sessions";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";

// POST /api/account/delete — user-initiated account deletion.
//
// Accounts are anonymized, not removed: on-chain XP and credentials can't be
// erased, and forum posts stay under a "deleted user" label. What happens to each
// table is listed in lib/account/deletion-policy.ts and applied in one transaction
// by delete_account_data, which also revokes the sessions.
//
// SECURITY — own-account-only. The target user id is derived SOLELY from the
// Supabase server session (auth.getUser(), read from the request cookies). The
// request body is never read, so there is no field a caller could set to name,
// spoof, or influence a different user_id. This mirrors /api/auth/unlink.

function failed(stage: string, error: unknown): NextResponse {
  logError({
    errorId: ERROR_IDS.ACCOUNT_DELETE_FAILED,
    error: error instanceof Error ? error : new Error(String(error)),
    context: { route: "/api/account/delete", stage },
  });
  return NextResponse.json(
    { error: "Failed to process deletion" },
    { status: 500 }
  );
}

export async function POST(): Promise<NextResponse> {
  try {
    // Server client bound to the request cookies. getUser() re-validates the
    // session with the Supabase auth server (does not trust the cookie blindly).
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Throttle per authenticated user (key = session-derived id, never client
    // input). Deletion is destructive + one-shot; a tiny bucket is plenty and
    // blocks accidental double-submits / abuse. Fails open (see rate-limit.ts).
    if (
      await isRateLimited("account-delete", user.id, {
        maxTokens: 3,
        refillIntervalMs: 60_000,
      })
    ) {
      return NextResponse.json(
        { error: "Too many attempts. Try again shortly." },
        { status: 429 }
      );
    }

    const admin = createAdminClient();

    // The avatar goes first. Storage refuses SQL deletes, so this can't join the
    // RPC's transaction, and the RPC ends the session: anything left for afterwards
    // could never be retried, and a public file would outlive the account.
    const avatars = admin.storage.from("avatars");
    const { data: files, error: listError } = await avatars.list(user.id);
    if (listError) return failed("avatar_list", listError.message);
    if (files && files.length > 0) {
      const { error: removeError } = await avatars.remove(
        files.map((file) => `${user.id}/${file.name}`)
      );
      if (removeError) return failed("avatar_remove", removeError.message);
    }

    // All or nothing. On failure nothing changed and the session is still good, so
    // the client can retry.
    const { error: deleteError } = await admin.rpc("delete_account_data", {
      p_user_id: user.id,
    });
    if (deleteError) return failed("delete_account_data", deleteError.message);

    // The account is gone at this point: the RPC removed its sessions and set the
    // ban. signOut clears this browser's cookies; GoTrue answers 403 for the session
    // that no longer exists, and auth-js treats that as signed out. The ban through
    // the API is a second layer. Neither can fail the request, because a retry would
    // now get 401 for an account that was deleted.
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      logError({
        errorId: ERROR_IDS.ACCOUNT_DELETE_FAILED,
        error: new Error(signOutError.message),
        context: { route: "/api/account/delete", stage: "sign_out" },
      });
    }
    const revoked = await revokeUserSessions(admin, user.id);
    if (!revoked.ok) {
      logError({
        errorId: ERROR_IDS.ACCOUNT_DELETE_FAILED,
        error: revoked.error ?? new Error("session revocation (ban) failed"),
        context: { route: "/api/account/delete", stage: "revoke_sessions" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return failed("unexpected", err);
  }
}
