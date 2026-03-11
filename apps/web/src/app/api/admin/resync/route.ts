import "server-only";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchEnrollment,
  fetchAchievementReceiptData,
} from "@/lib/solana/academy-reads";
import { decodeLessonBitmap } from "@/lib/solana/bitmap";
import { getAllCourses, getAllAchievements } from "@/lib/sanity/queries";
import { calculateLevel } from "@/lib/gamification/xp";

const ADMIN_SECRET = process.env.ADMIN_SECRET;

function verifyAdminToken(header: string | null): boolean {
  if (!ADMIN_SECRET || !header?.startsWith("Bearer ")) return false;
  const token = header.slice(7);
  const tokenBuf = Buffer.from(token);
  const secretBuf = Buffer.from(ADMIN_SECRET);
  if (tokenBuf.length !== secretBuf.length) return false;
  return crypto.timingSafeEqual(tokenBuf, secretBuf);
}

function isValidBase58(value: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

export async function POST(req: NextRequest) {
  // Admin auth (timing-safe comparison)
  if (!verifyAdminToken(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  const xpMintAddress = process.env.NEXT_PUBLIC_XP_MINT_ADDRESS;
  if (!rpcUrl || !xpMintAddress) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  let body: { walletAddress?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { walletAddress } = body;
  if (
    !walletAddress ||
    typeof walletAddress !== "string" ||
    !isValidBase58(walletAddress)
  ) {
    return NextResponse.json(
      { error: "walletAddress must be a valid Solana public key" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const connection = new Connection(rpcUrl);
  const wallet = new PublicKey(walletAddress);
  const XP_MINT = new PublicKey(xpMintAddress);

  // Resolve user
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json(
      { error: "No profile for wallet" },
      { status: 404 }
    );
  }

  const results = {
    xp: 0,
    enrollments: 0,
    lessonsCompleted: 0,
    coursesCompleted: 0,
    achievements: 0,
    certificates: 0,
  };

  // 1. Sync XP balance from Token-2022 ATA (also recalculate level)
  let onChainXp = 0;
  try {
    const ata = getAssociatedTokenAddressSync(
      XP_MINT,
      wallet,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    const account = await getAccount(
      connection,
      ata,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    onChainXp = Number(account.amount);
    await supabase.from("user_xp").upsert(
      {
        user_id: profile.id,
        total_xp: onChainXp,
        level: calculateLevel(onChainXp),
      },
      { onConflict: "user_id" }
    );
    results.xp = onChainXp;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.includes("could not find account") ||
      message.includes("TokenAccountNotFound")
    ) {
      // ATA doesn't exist — user has 0 XP on-chain, this is normal
    } else {
      console.error("[resync] XP balance fetch failed:", message);
    }
  }

  // 2. Sync enrollments + lesson progress from on-chain Enrollment PDAs
  const courses = await getAllCourses();

  for (const course of courses) {
    try {
      const enrollment = await fetchEnrollment(course._id, wallet, connection);
      if (!enrollment) continue;

      // Upsert enrollment
      await supabase.from("enrollments").upsert(
        {
          user_id: profile.id,
          course_id: course._id,
          enrolled_at: enrollment.enrolled_at
            ? new Date(Number(enrollment.enrolled_at) * 1000).toISOString()
            : new Date().toISOString(),
          wallet_address: walletAddress,
        },
        { onConflict: "user_id,course_id" }
      );
      results.enrollments++;

      // Decode lesson bitmap → sync individual lesson progress
      const allLessons = (course.modules ?? [])
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .flatMap((m) =>
          (m.lessons ?? []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        );

      const lessonCount = enrollment.lesson_count
        ? Number(enrollment.lesson_count)
        : allLessons.length;

      if (enrollment.lesson_flags && lessonCount > 0) {
        const bitmap = decodeLessonBitmap(enrollment.lesson_flags, lessonCount);

        for (let i = 0; i < bitmap.length && i < allLessons.length; i++) {
          const lesson = allLessons[i];
          if (bitmap[i] && lesson) {
            await supabase.from("user_progress").upsert(
              {
                user_id: profile.id,
                course_id: course._id,
                lesson_id: lesson._id,
                completed: true,
                completed_at: enrollment.enrolled_at
                  ? new Date(
                      Number(enrollment.enrolled_at) * 1000
                    ).toISOString()
                  : new Date().toISOString(),
              },
              { onConflict: "user_id,lesson_id", ignoreDuplicates: true }
            );
            results.lessonsCompleted++;
          }
        }
      }

      // Check course completion
      if (enrollment.completed_at && Number(enrollment.completed_at) > 0) {
        await supabase
          .from("enrollments")
          .update({
            completed_at: new Date(
              Number(enrollment.completed_at) * 1000
            ).toISOString(),
          })
          .eq("user_id", profile.id)
          .eq("course_id", course._id);
        results.coursesCompleted++;
      }

      // Check credential NFT (on-chain PDA field, no DAS needed)
      if (enrollment.credential_asset) {
        const mintAddr =
          typeof enrollment.credential_asset === "string"
            ? enrollment.credential_asset
            : new PublicKey(
                enrollment.credential_asset as Uint8Array
              ).toBase58();

        await supabase.from("certificates").upsert(
          {
            user_id: profile.id,
            course_id: course._id,
            course_title: course.title,
            mint_address: mintAddr,
            credential_type: "core",
          },
          { onConflict: "user_id,course_id" }
        );
        results.certificates++;
      }
    } catch (err) {
      console.error(
        `[resync] Error syncing enrollment for course ${course._id}:`,
        err
      );
    }
  }

  // 3. Sync achievements from on-chain AchievementReceipt PDAs
  // Use getAllAchievements (not getDeployedAchievements) because receipt PDAs
  // can exist even if the AchievementType wasn't admin-synced to Sanity yet.
  const allAchievements = await getAllAchievements();

  for (const achievement of allAchievements) {
    try {
      const receipt = await fetchAchievementReceiptData(
        achievement.id,
        walletAddress,
        connection
      );
      if (!receipt) continue;

      const assetAddr =
        typeof receipt.asset === "string"
          ? receipt.asset
          : new PublicKey(receipt.asset as Uint8Array).toBase58();

      await supabase.rpc("unlock_achievement", {
        p_user_id: profile.id,
        p_achievement_id: achievement.id,
        p_tx_signature: `resync:${assetAddr}`,
        p_asset_address: assetAddr,
      });

      const xpReward = achievement.xpReward ?? 0;
      if (xpReward > 0) {
        await supabase.rpc("award_xp", {
          p_user_id: profile.id,
          p_amount: xpReward,
          p_reason: `Achievement reward: ${achievement.id}`,
          p_idempotency_key: `resync:${assetAddr}:xp`,
          p_tx_signature: `resync:${assetAddr}`,
        });
      }

      results.achievements++;
    } catch (err) {
      console.error(
        `[resync] Error syncing achievement ${achievement.id}:`,
        err
      );
    }
  }

  // 4. Final correction: set total_xp = on-chain + DB-only community XP
  // Community XP (threads, answers, votes) is never minted on-chain, so we
  // must preserve it by summing from xp_transactions.
  if (onChainXp > 0) {
    const { data: communityTxRows } = await supabase
      .from("xp_transactions")
      .select("amount")
      .eq("user_id", profile.id)
      .like("reason", "community:%");
    const communityXp = (communityTxRows ?? []).reduce(
      (sum, r) => sum + (r.amount ?? 0),
      0
    );

    const totalXp = onChainXp + communityXp;
    await supabase
      .from("user_xp")
      .update({ total_xp: totalXp, level: calculateLevel(totalXp) })
      .eq("user_id", profile.id);
  }

  return NextResponse.json({
    synced: true,
    wallet: walletAddress,
    ...results,
  });
}
