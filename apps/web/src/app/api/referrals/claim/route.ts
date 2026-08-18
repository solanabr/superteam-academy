import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";
import { serverEnv } from "@/lib/env.server";

// Auth/cookie + per-request DB access — never statically prerender (DYNAMIC_SERVER_USAGE).
export const dynamic = "force-dynamic";

/** Matches chk_profiles_referral_code_shape — reject garbage before the DB. */
const CODE_SHAPE = /^[a-f0-9]{8}$/;

/**
 * Outcome keys claim_referral can return. All are 200s — every one is a
 * terminal answer the capture flow uses to stop retrying; only transport or
 * server failures are non-2xx (the client keeps the stored code and retries
 * next session).
 */
const KNOWN_OUTCOMES = new Set([
  "claimed",
  "alreadyReferred",
  "invalidCode",
  "invalidAccount",
  "selfReferral",
  "claimWindowClosed",
]);

/**
 * Attach a captured ?ref= code to the signed-in account. The learner id comes
 * from the SESSION, never the body — nobody can claim on someone else's
 * behalf. All the point-minting guards (write-once, no self-referral, 7-day
 * window) live in the SECURITY DEFINER claim_referral function.
 */
export async function POST(request: NextRequest) {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !serverEnv.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
      code?: unknown;
    } | null;
    const code = typeof body?.code === "string" ? body.code : "";
    if (!CODE_SHAPE.test(code)) {
      // Terminal for the capture flow, exactly like the DB's own invalidCode.
      return NextResponse.json({ outcome: "invalidCode" });
    }

    const admin = createAdminClient();
    const { data: outcome, error } = await admin.rpc("claim_referral", {
      p_referred_id: user.id,
      p_code: code,
    });
    if (error) throw new Error(error.message);

    return NextResponse.json({
      outcome: KNOWN_OUTCOMES.has(outcome ?? "") ? outcome : "invalidCode",
    });
  } catch (error) {
    logError({
      errorId: ERROR_IDS.REFERRAL_CLAIM_FAILED,
      error: error instanceof Error ? error : new Error(String(error)),
      context: { route: "/api/referrals/claim" },
    });
    return NextResponse.json({ error: "Claim failed" }, { status: 500 });
  }
}
