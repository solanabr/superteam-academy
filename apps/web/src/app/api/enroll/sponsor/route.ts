import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCourseById } from "@/lib/content/queries";
import { describeProgramError } from "@/lib/solana/academy-program";
import { buildSponsoredEnrollTransaction } from "@/lib/solana/sponsor-enroll";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";
import { isCourseInMaintenance } from "@/lib/content/deployments";
import { isPlatformFrozen } from "@/lib/platform/freeze";
import { platformFrozenResponse } from "@/lib/platform/freeze-http";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";

/**
 * Build a platform-sponsored `enroll` transaction (#1004).
 *
 * Returns a transaction already signed by the backend signer, which pays both
 * the fee and the Enrollment PDA rent. The caller's wallet co-signs and submits
 * it. That co-signature is required by the program, so this route cannot enrol
 * anyone on its own.
 *
 * THE LEARNER IS NOT TAKEN FROM THE REQUEST. It is read from the session's own
 * profile, so a caller can only ever have their own linked wallet sponsored.
 * Accepting a learner pubkey from the body would let anyone spend the
 * platform's SOL enrolling wallets they do not control.
 */
export async function POST(request: NextRequest) {
  try {
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

    // Reject unknown courses before building anything. The program would reject
    // them too, but only after the learner submitted — and a failed transaction
    // still costs the sponsor the fee.
    if (!getCourseById(courseId)) {
      return NextResponse.json({ error: "Unknown course" }, { status: 404 });
    }

    // Each sponsored enrolment costs the platform rent it does not get back
    // unless the enrollment is later closed. A learner can only enrol once per
    // course, so the honest ceiling is low; this bounds the dishonest one, where
    // a caller loops the route to burn blockhash lookups and sponsored rent.
    if (
      await isRateLimited("enroll:sponsor", user.id, {
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
      await isRateLimited("enroll:sponsor:ip", getClientIp(request.headers), {
        maxTokens: 300,
        refillIntervalMs: 3_600_000,
      })
    ) {
      return NextResponse.json(
        { error: "Too many enrolment attempts from this network." },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }

    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from("profiles")
      .select("wallet_address")
      .eq("id", user.id)
      .single();

    if (!profile?.wallet_address) {
      return NextResponse.json(
        { error: "No wallet linked to this account" },
        { status: 400 }
      );
    }

    let learner: PublicKey;
    try {
      learner = new PublicKey(profile.wallet_address);
    } catch {
      // A malformed wallet_address is our data problem, not the caller's.
      logError({
        errorId: ERROR_IDS.ENROLL_SPONSOR_BAD_WALLET,
        error: new Error("unparseable profiles.wallet_address"),
        context: { userId: user.id },
      });
      return NextResponse.json(
        { error: "Linked wallet is invalid" },
        { status: 500 }
      );
    }

    const sponsored = await buildSponsoredEnrollTransaction(courseId, learner);

    return NextResponse.json({
      success: true,
      ...sponsored,
      learner: learner.toBase58(),
    });
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.ENROLL_SPONSOR_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
    });
    return NextResponse.json(
      { error: describeProgramError(err) },
      { status: 500 }
    );
  }
}
