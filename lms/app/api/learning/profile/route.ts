import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { ensureUser, getLevel } from "@/lib/db/helpers";
import {
  fetchConfig,
  fetchLearnerProfile,
  fetchXPBalance,
} from "@/lib/solana/readers";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json(null);

  // Always fetch MongoDB for displayName/bio (off-chain data)
  const user = await ensureUser(userId);

  // Try on-chain data
  try {
    const wallet = new PublicKey(userId);
    const [config, profile] = await Promise.all([
      fetchConfig(),
      fetchLearnerProfile(wallet),
    ]);

    if (profile && config) {
      const xp = await fetchXPBalance(wallet, config.currentMint);
      const lastActivityTs =
        typeof profile.lastActivityDate === "object" &&
        "toNumber" in (profile.lastActivityDate as any)
          ? (profile.lastActivityDate as any).toNumber()
          : Number(profile.lastActivityDate);

      return NextResponse.json({
        wallet: user.wallet,
        displayName: user.displayName,
        bio: user.bio,
        avatar: user.avatar,
        xp,
        level: getLevel(xp),
        currentStreak: profile.currentStreak,
        longestStreak: profile.longestStreak,
        lastActivityDate: lastActivityTs,
        streakFreezes: profile.streakFreezes,
        achievementFlags: profile.achievementFlags.map((f: any) =>
          typeof f === "object" && "toString" in f
            ? Number(f.toString())
            : Number(f),
        ),
        referralCount: profile.referralCount,
        hasReferrer: profile.hasReferrer,
        joinedAt: user.joinedAt.toISOString(),
      });
    }
  } catch {
    // fallback to MongoDB-only
  }

  return NextResponse.json({
    wallet: user.wallet,
    displayName: user.displayName,
    bio: user.bio,
    avatar: user.avatar,
    xp: user.xp,
    level: getLevel(user.xp),
    currentStreak: user.streak.current,
    longestStreak: user.streak.longest,
    lastActivityDate: user.streak.lastDay * 86400,
    streakFreezes: 0,
    achievementFlags: [0, 0, 0, 0],
    referralCount: 0,
    hasReferrer: false,
    joinedAt: user.joinedAt.toISOString(),
  });
}
