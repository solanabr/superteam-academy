import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCourseById } from "@/lib/content/queries";
import { describeProgramError } from "@/lib/solana/academy-program";
import {
  deriveCustodialKeypair,
  isCustodialWalletEnabled,
} from "@/lib/solana/custodial-wallet";
import { sendCustodialEnroll } from "@/lib/solana/custodial-enroll";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { isCourseInMaintenance } from "@/lib/content/deployments";
import { isPlatformFrozen } from "@/lib/platform/freeze";
import { platformFrozenResponse } from "@/lib/platform/freeze-http";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";
import type { Json } from "@/lib/supabase/types";

/**
 * Walletless enrolment via a platform-custodied wallet (Academy Wallet).
 *
 * For a signed-in account with NO linked wallet, this derives the account's
 * custodial keypair (lib/solana/custodial-wallet.ts), binds it as the
 * profile's wallet, and completes the on-chain `enroll` entirely server-side —
 * fee and rent paid by the backend sponsor, learner signature provided by the
 * derived key. One Google login is the entire flow; every downstream feature
 * (lesson completion, XP, credentials) already keys off
 * `profiles.wallet_address` and backend signing, so it all just works.
 *
 * THE LEARNER IS NEVER TAKEN FROM THE REQUEST — the keypair is derived from
 * the session's own user id, so a caller can only ever enrol themselves.
 *
 * Accounts that already linked a DIFFERENT wallet are refused with a stable
 * key (409 `walletLinked`): their enrolments belong to that wallet, and
 * silently switching them to a custodial one would strand their history.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isCustodialWalletEnabled()) {
      return NextResponse.json({ error: "custodialDisabled" }, { status: 503 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { courseId?: unknown };
    if (typeof body.courseId !== "string" || !body.courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );
    }
    const courseId = body.courseId;

    if (await isPlatformFrozen()) {
      return platformFrozenResponse();
    }

    if (await isCourseInMaintenance(courseId)) {
      return NextResponse.json(
        {
          error:
            "This course is undergoing maintenance. Please try again in a few minutes.",
        },
        { status: 503, headers: { "Retry-After": "60" } }
      );
    }

    if (!getCourseById(courseId)) {
      return NextResponse.json({ error: "Unknown course" }, { status: 404 });
    }

    // Same budget rationale as /api/enroll/sponsor: each enrolment costs the
    // platform unrecoverable rent, honest use is bounded (once per course), so
    // the limits exist for the dishonest looping caller.
    if (
      await isRateLimited("enroll:custodial", user.id, {
        maxTokens: 30,
        refillIntervalMs: 3_600_000,
      })
    ) {
      return NextResponse.json(
        { error: "Too many enrolment attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }

    if (
      await isRateLimited("enroll:custodial:ip", getClientIp(request.headers), {
        maxTokens: 300,
        refillIntervalMs: 3_600_000,
      })
    ) {
      return NextResponse.json(
        { error: "Too many enrolment attempts from this network." },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }

    const custodial = deriveCustodialKeypair(user.id);
    const custodialAddress = custodial.publicKey.toBase58();

    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from("profiles")
      .select("wallet_address, prefs")
      .eq("id", user.id)
      .single();

    if (
      profile?.wallet_address &&
      profile.wallet_address !== custodialAddress
    ) {
      // A real wallet is already linked — enrolment must go through it (the
      // sponsored or self-paid client flows), not a custodial shadow wallet.
      return NextResponse.json({ error: "walletLinked" }, { status: 409 });
    }

    if (!profile?.wallet_address) {
      // First custodial action for this account: bind the derived address as
      // the profile wallet and stamp provenance (mirrors the #987
      // "phantom-embedded" marker) so the UI and any future export/graduation
      // flow can tell custodial wallets apart from user-owned ones.
      const prior = profile?.prefs;
      const prefs = {
        ...(typeof prior === "object" && prior !== null && !Array.isArray(prior)
          ? (prior as Record<string, unknown>)
          : {}),
        walletProvider: "custodial",
      };
      const { error: bindError } = await adminClient
        .from("profiles")
        .update({
          wallet_address: custodialAddress,
          prefs: prefs as unknown as Json,
        })
        .eq("id", user.id)
        // Guard against a concurrent link (SIWS in another tab): only claim
        // the slot while it is still empty, then re-check.
        .is("wallet_address", null);
      if (bindError) {
        throw new Error(
          `Failed to bind custodial wallet: ${bindError.message}`
        );
      }
      const { data: recheck } = await adminClient
        .from("profiles")
        .select("wallet_address")
        .eq("id", user.id)
        .single();
      if (recheck?.wallet_address !== custodialAddress) {
        return NextResponse.json({ error: "walletLinked" }, { status: 409 });
      }
    }

    const result = await sendCustodialEnroll(courseId, custodial);

    // Write the DB row directly instead of waiting for the Helius webhook —
    // the whole point is that the learner lands in the course instantly. The
    // upsert matches the webhook's (onConflict user_id,course_id), so the
    // webhook arriving later is a harmless no-op.
    const { error: upsertError } = await adminClient.from("enrollments").upsert(
      {
        user_id: user.id,
        course_id: courseId,
        enrolled_at: new Date().toISOString(),
        tx_signature: result.signature,
        wallet_address: custodialAddress,
      },
      { onConflict: "user_id,course_id", ignoreDuplicates: true }
    );
    if (upsertError) {
      // The on-chain enrolment is real even if the mirror write failed; the
      // webhook/queue will reconcile. Log, don't fail the request.
      logError({
        errorId: ERROR_IDS.ENROLLMENT_SYNC_FAILED,
        error: new Error(upsertError.message),
        context: { userId: user.id, courseId },
      });
    }

    return NextResponse.json({
      success: true,
      signature: result.signature,
      alreadyEnrolled: result.alreadyEnrolled,
      wallet: custodialAddress,
    });
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.ENROLL_CUSTODIAL_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
    });
    return NextResponse.json(
      { error: describeProgramError(err) },
      { status: 500 }
    );
  }
}
