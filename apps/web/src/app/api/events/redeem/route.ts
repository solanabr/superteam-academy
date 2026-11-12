import { NextRequest, NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { eventWindowState, normalizeEventCode } from "@/lib/events/events";
import { eventImageUrl } from "@/lib/events/images";
import { siteOrigin } from "@/lib/metadata/site-origin";
import { retryPendingOnchainActions } from "@/lib/solana/onchain-queue";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";
import { serverEnv } from "@/lib/env.server";

/**
 * POST /api/events/redeem — `{ code }`. Records that the signed-in learner
 * attended the event the code belongs to, if the code is live, and queues the
 * event's on-chain award (badge NFT + XP) through the same `achievement` action
 * course achievements use. A learner without a wallet keeps the attendance; the
 * queue holds the award until they link one.
 *
 * The learner is the session, never the body. Rate-limited per account and per
 * IP, failing closed, so codes can't be guessed by brute force.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
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

    const limited =
      (await isRateLimited("event-redeem", user.id, {
        maxTokens: 10,
        refillIntervalMs: 60_000,
        failClosed: true,
      })) ||
      (await isRateLimited("event-redeem:ip", getClientIp(req.headers), {
        maxTokens: 30,
        refillIntervalMs: 60_000,
        failClosed: true,
      }));
    if (limited) {
      return NextResponse.json({ error: "rateLimited" }, { status: 429 });
    }

    let code: string | null = null;
    try {
      const body = (await req.json()) as { code?: unknown };
      code =
        typeof body.code === "string" ? normalizeEventCode(body.code) : null;
    } catch {
      // Treated as an invalid code below.
    }
    if (!code) {
      return NextResponse.json({ error: "invalidCode" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: event } = await admin
      .from("events")
      .select(
        "id, achievement_id, name, description, image_url, xp_reward, starts_at, ends_at, collection_address"
      )
      .eq("code", code)
      .maybeSingle();
    if (!event) {
      return NextResponse.json({ error: "invalidCode" }, { status: 404 });
    }

    const state = eventWindowState({
      startsAt: event.starts_at,
      endsAt: event.ends_at,
    });
    if (state === "upcoming") {
      return NextResponse.json(
        { error: "notStarted", startsAt: event.starts_at },
        { status: 409 }
      );
    }
    if (state === "ended") {
      return NextResponse.json(
        { error: "ended", endsAt: event.ends_at },
        { status: 410 }
      );
    }
    if (!event.collection_address) {
      return NextResponse.json({ error: "notReady" }, { status: 409 });
    }

    const summary = {
      achievementId: event.achievement_id,
      name: event.name,
      description: event.description,
      imageUrl: eventImageUrl(
        { achievementId: event.achievement_id, imageUrl: event.image_url },
        siteOrigin()
      ),
      startsAt: event.starts_at,
      xpReward: event.xp_reward,
    };

    const { error: attendError } = await admin
      .from("event_attendances")
      .insert({ event_id: event.id, user_id: user.id });
    if (attendError) {
      if (attendError.code === "23505") {
        return NextResponse.json(
          { error: "alreadyRedeemed", event: summary },
          { status: 409 }
        );
      }
      throw new Error(attendError.message);
    }

    const { error: queueError } = await admin
      .from("pending_onchain_actions")
      .upsert(
        {
          user_id: user.id,
          action_type: "achievement",
          reference_id: event.achievement_id,
          payload: { source: "event", eventId: event.id },
        },
        { onConflict: "user_id,action_type,reference_id" }
      );
    if (queueError) {
      // Without the queue row the award would never be sent, and a kept
      // attendance would answer every retry with alreadyRedeemed.
      await admin
        .from("event_attendances")
        .delete()
        .eq("event_id", event.id)
        .eq("user_id", user.id);
      throw new Error(queueError.message);
    }

    // Mint now if we can; the cron drain picks it up if this doesn't land.
    after(async () => {
      try {
        await retryPendingOnchainActions(user.id);
      } catch (err: unknown) {
        logError({
          errorId: ERROR_IDS.EVENT_REDEEM_FAILED,
          error: err instanceof Error ? err : new Error(String(err)),
          context: { route: "/api/events/redeem", step: "drain" },
        });
      }
    });

    const { data: profile } = await admin
      .from("profiles")
      .select("wallet_address")
      .eq("id", user.id)
      .maybeSingle();

    return NextResponse.json({
      event: summary,
      walletLinked: Boolean(profile?.wallet_address),
    });
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.EVENT_REDEEM_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { route: "/api/events/redeem" },
    });
    return NextResponse.json({ error: "redeemFailed" }, { status: 500 });
  }
}
