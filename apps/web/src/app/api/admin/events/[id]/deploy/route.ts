import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { serverEnv } from "@/lib/env.server";
import { isPlatformFrozen } from "@/lib/platform/freeze";
import { platformFrozenResponse } from "@/lib/platform/freeze-http";
import { createAdminClient } from "@/lib/supabase/admin";
import { findAchievementTypePDA, getProgramId } from "@/lib/solana/pda";
import { fetchAchievementType } from "@/lib/solana/academy-reads";
import { deployAchievementType } from "@/lib/solana/admin-signer";
import { eventMetadataUri } from "@/lib/metadata/pinned-uri";
import { EVENT_COLUMNS, adminGuard, toAdminEvent } from "@/lib/events/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/events/:id/deploy — create the event's on-chain achievement
 * type, the same `create_achievement_type` the achievement sync sends. Until
 * this lands, redeeming the code is refused. Idempotent: a type that already
 * exists on-chain only has its collection address recovered.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await adminGuard(req);
  if ("denied" in auth) return auth.denied;
  if (await isPlatformFrozen()) return platformFrozenResponse();
  const { id } = await context.params;

  const admin = createAdminClient();
  const { data: event } = await admin
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (!event) {
    return NextResponse.json({ error: "notFound" }, { status: 404 });
  }
  if (event.collection_address) {
    return NextResponse.json({ action: "noop", event: toAdminEvent(event, 0) });
  }

  const connection = new Connection(serverEnv.SOLANA_RPC_URL, "confirmed");
  const programId = getProgramId();
  const [pda] = findAchievementTypePDA(event.achievement_id, programId);

  let collectionAddress: string | null = null;
  let deployTx: string | null = null;
  // What the on-chain type actually holds. Written back below, so the event's
  // name and XP can never drift from what a redemption mints, whether an edit
  // raced the deploy or a timed-out send landed anyway.
  let onChain = { name: event.name, xpReward: event.xp_reward };

  if (await connection.getAccountInfo(pda)) {
    const decoded = await fetchAchievementType(
      event.achievement_id,
      connection,
      programId
    );
    if (decoded?.collection) {
      collectionAddress =
        typeof decoded.collection === "string"
          ? decoded.collection
          : new PublicKey(decoded.collection as Uint8Array).toBase58();
      onChain = { name: decoded.name, xpReward: Number(decoded.xp_reward) };
    }
  } else {
    // Our own origin only: the URI is copied into every badge the type mints
    // and can't be changed afterwards.
    let metadataUri: string;
    try {
      metadataUri = eventMetadataUri(event.achievement_id);
    } catch (err) {
      console.error("[admin/events/deploy] metadata URI refused:", err);
      return NextResponse.json(
        { error: "metadataUriRefused" },
        { status: 500 }
      );
    }

    const result = await deployAchievementType({
      achievementId: event.achievement_id,
      name: event.name,
      metadataUri,
      maxSupply: 0,
      xpReward: event.xp_reward,
    });
    if (!result.success || !result.collectionAddress) {
      console.error("[admin/events/deploy] deploy failed:", result.error);
      return NextResponse.json({ error: "deployFailed" }, { status: 500 });
    }
    collectionAddress = result.collectionAddress;
    deployTx = result.signature ?? null;
  }

  if (!collectionAddress) {
    return NextResponse.json({ error: "deployFailed" }, { status: 500 });
  }

  const { data: updated, error } = await admin
    .from("events")
    .update({
      name: onChain.name,
      xp_reward: onChain.xpReward,
      collection_address: collectionAddress,
      deploy_tx: deployTx,
      deployed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(EVENT_COLUMNS)
    .single();
  if (error) {
    // On-chain it exists; the next deploy click recovers the address.
    console.error("[admin/events/deploy] write-back failed:", error.message);
    return NextResponse.json({ error: "writeBackFailed" }, { status: 500 });
  }

  const { count } = await admin
    .from("event_attendances")
    .select("id", { count: "exact", head: true })
    .eq("event_id", id);
  return NextResponse.json({
    action: deployTx ? "created" : "recovered",
    event: toAdminEvent(updated, count ?? 0),
  });
}
