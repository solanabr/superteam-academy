import "server-only";

import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isRateLimited } from "@/lib/rate-limit";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";
import type { Database } from "@/lib/supabase/types";

// POST /api/account/delete — user-initiated data-deletion request (readiness G6).
//
// Soft-delete + anonymize the CALLER'S OWN profile, then sign them out. We never
// hard-delete: on-chain XP and credential NFTs are immutable and bound to the
// wallet, and DB history is referenced by those artifacts. The migration
// (…_account_deletion.sql) drops soft-deleted profiles out of every public read.
//
// SECURITY — own-account-only. The target user id is derived SOLELY from the
// Supabase server session (auth.getUser(), read from the request cookies). The
// request body is never read, so there is no field a caller could set to name,
// spoof, or influence a different user_id. Every write below is scoped
// .eq("id", user.id) with that session-derived id. This mirrors /api/auth/unlink.
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

    // Service-role write, scoped to the caller's own row. A short random suffix
    // keeps the scrubbed username unique (username has a UNIQUE constraint) and
    // non-identifying. deleted_at/deletion_requested_at tombstone the row so the
    // public reads updated by the migration stop surfacing it; is_public=false
    // is belt-and-suspenders with those reads.
    const admin = createAdminClient();
    const now = new Date().toISOString();
    const anonUsername = `deleted-user-${crypto.randomBytes(4).toString("hex")}`;

    // Every external identifier goes, not just the display fields (#410). These
    // three are what actually re-identify a person: the wallet is a public
    // on-chain handle, and google_id/github_id are stable provider subject ids.
    // Scrubbing bio/avatar while keeping them anonymises nothing.
    const update: Database["public"]["Tables"]["profiles"]["Update"] = {
      username: anonUsername,
      bio: null,
      avatar_url: null,
      social_links: null,
      wallet_address: null,
      google_id: null,
      github_id: null,
      is_public: false,
      deleted_at: now,
      deletion_requested_at: now,
    };

    const { error: updateError } = await admin
      .from("profiles")
      .update(update)
      .eq("id", user.id);

    if (updateError) {
      logError({
        errorId: ERROR_IDS.ACCOUNT_DELETE_FAILED,
        error: new Error(updateError.message),
        context: { route: "/api/account/delete", stage: "anonymize" },
      });
      return NextResponse.json(
        { error: "Failed to process deletion" },
        { status: 500 }
      );
    }

    // enrollments carries its own copy of wallet_address (written by the Helius
    // webhook and by admin resync). Scrubbing only `profiles` would leave the
    // wallet→user_id join intact one table over, so the deletion would be
    // cosmetic. Nothing reads this column — it has writers only — so nulling it
    // is safe. Enrollment rows themselves are kept: on-chain XP and credentials
    // are immutable and reference them.
    const { error: enrollmentError } = await admin
      .from("enrollments")
      .update({ wallet_address: null })
      .eq("user_id", user.id);

    if (enrollmentError) {
      // The profile is already anonymised; report the failure rather than
      // pretending the deletion was complete, so it can be retried.
      logError({
        errorId: ERROR_IDS.ACCOUNT_DELETE_FAILED,
        error: new Error(enrollmentError.message),
        context: { route: "/api/account/delete", stage: "scrub_enrollments" },
      });
      return NextResponse.json(
        { error: "Failed to process deletion" },
        { status: 500 }
      );
    }

    // Clear the session (best-effort). Even if this fails the account is already
    // anonymized; the client also drops its local session after the redirect.
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.ACCOUNT_DELETE_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { route: "/api/account/delete" },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
