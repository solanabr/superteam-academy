import "server-only";

import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { serverEnv } from "@/lib/env.server";
import {
  requireAdminAuth,
  adminUnauthorizedResponse,
  AdminAuthError,
} from "@/lib/admin/auth";
import {
  COURSES_CACHE_TAG,
  getAllAchievementsAdmin,
} from "@/lib/content/queries";
import { findAchievementTypePDA, getProgramId } from "@/lib/solana/pda";
import { fetchAchievementType } from "@/lib/solana/academy-reads";
import { deployAchievementType } from "@/lib/solana/admin-signer";
import { getMissingAchievementFields, isDraftId } from "@/lib/admin/sync-diff";
import { writeAchievementOnChainStatus } from "@/lib/content/deployment-writes";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    requireAdminAuth(req);
  } catch (e) {
    if (e instanceof AdminAuthError) return adminUnauthorizedResponse();
    throw e;
  }

  let achievementId: string;
  try {
    const body = (await req.json()) as { achievementId?: unknown };
    if (typeof body.achievementId !== "string" || !body.achievementId) {
      return NextResponse.json(
        { error: "achievementId is required" },
        { status: 400 }
      );
    }
    achievementId = body.achievementId;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (new TextEncoder().encode(achievementId).length > 32) {
    return NextResponse.json(
      { error: "achievementId exceeds 32 bytes (on-chain limit)" },
      { status: 400 }
    );
  }

  if (isDraftId(achievementId)) {
    return NextResponse.json(
      { error: "Cannot sync draft documents" },
      { status: 400 }
    );
  }

  const achievements = await getAllAchievementsAdmin();
  const ach = achievements.find((a) => a._id === achievementId);
  if (!ach) {
    return NextResponse.json(
      { error: "Achievement not found in Sanity" },
      { status: 404 }
    );
  }

  const missingFields = getMissingAchievementFields(ach);
  if (missingFields.length > 0) {
    return NextResponse.json(
      { error: "Missing required fields", missingFields },
      { status: 400 }
    );
  }

  const connection = new Connection(serverEnv.SOLANA_RPC_URL, "confirmed");
  const [achPda] = findAchievementTypePDA(achievementId, getProgramId());
  const accountInfo = await connection.getAccountInfo(achPda);

  if (accountInfo) {
    // PDA exists — recover collection address from on-chain if missing in Sanity
    const existingCollection = ach.onChainStatus?.collectionAddress;
    if (!existingCollection) {
      try {
        const decoded = await fetchAchievementType(
          achievementId,
          connection,
          getProgramId()
        );
        if (decoded?.collection) {
          const collectionAddr =
            typeof decoded.collection === "string"
              ? decoded.collection
              : new PublicKey(decoded.collection as Uint8Array).toBase58();
          await writeAchievementOnChainStatus(
            achievementId,
            achPda.toBase58(),
            collectionAddr
          );
          // Purge the cached deployment map so the recovered achievement is
          // visible to getDeployedAchievements immediately (not after the 1h
          // ISR window), mirroring the course writers.
          revalidateTag(COURSES_CACHE_TAG);
          return NextResponse.json({
            action: "recovered",
            message: "Collection address recovered from on-chain data",
            achievementPda: achPda.toBase58(),
            collectionAddress: collectionAddr,
          });
        }
      } catch (recoverErr) {
        console.error(
          "[admin/achievements/sync] Collection recovery failed:",
          recoverErr
        );
      }
    }
    return NextResponse.json({
      action: "noop",
      message: "Already deployed",
      collectionAddress: existingCollection ?? null,
    });
  }

  const metadataUri =
    ach.metadataUri ??
    `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/achievements/metadata/${achievementId}`;

  const result = await deployAchievementType({
    achievementId,
    name: ach.name,
    metadataUri,
    maxSupply: ach.maxSupply ?? 0,
    xpReward: ach.xpReward ?? 0,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? "Deployment failed" },
      { status: 500 }
    );
  }

  if (result.collectionAddress) {
    try {
      await writeAchievementOnChainStatus(
        achievementId,
        achPda.toBase58(),
        result.collectionAddress
      );
      // Purge the cached deployment map so the newly deployed achievement is
      // visible to getDeployedAchievements immediately (not after the 1h ISR
      // window), mirroring the course writers.
      revalidateTag(COURSES_CACHE_TAG);
    } catch (mutationErr) {
      console.error(
        "[admin/achievements/sync] Sanity write-back failed:",
        mutationErr
      );
    }
  }

  return NextResponse.json({
    action: "created",
    txSignature: result.signature,
    achievementPda: achPda.toBase58(),
    collectionAddress: result.collectionAddress,
  });
}
