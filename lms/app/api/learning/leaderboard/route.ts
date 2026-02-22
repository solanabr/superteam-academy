import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/user";
import { getLevel } from "@/lib/db/helpers";
import {
  fetchAllLearnerProfiles,
  fetchXPBalance,
  fetchConfig,
} from "@/lib/solana/readers";

export async function GET() {
  // Try on-chain first: fetch all LearnerProfile PDAs + XP balances
  try {
    const config = await fetchConfig();
    if (config) {
      const profiles = await fetchAllLearnerProfiles();
      if (profiles.length > 0) {
        const entries = await Promise.all(
          profiles.map(async ({ wallet, profile }) => {
            const xp = await fetchXPBalance(wallet, config.currentMint);
            return {
              wallet: wallet.toBase58(),
              xp,
              streak: profile.currentStreak ?? 0,
            };
          }),
        );

        // Merge with MongoDB for display names
        await connectDB();
        const wallets = entries.map((e) => e.wallet);
        const users = await User.find({ wallet: { $in: wallets } }).lean();
        const nameMap = new Map(users.map((u) => [u.wallet, u.displayName]));
        const avatarMap = new Map(users.map((u) => [u.wallet, u.avatar]));

        const ranked = entries
          .filter((e) => e.xp > 0)
          .sort((a, b) => b.xp - a.xp)
          .slice(0, 100)
          .map((e, i) => ({
            rank: i + 1,
            wallet: e.wallet,
            displayName: nameMap.get(e.wallet) ?? undefined,
            avatar: avatarMap.get(e.wallet) ?? undefined,
            xp: e.xp,
            level: getLevel(e.xp),
            streak: e.streak,
          }));

        return NextResponse.json(ranked);
      }
    }
  } catch {
    // fallback to MongoDB
  }

  // MongoDB fallback
  await connectDB();
  const users = await User.find({ xp: { $gt: 0 }, wallet: { $ne: "guest" } })
    .sort({ xp: -1 })
    .limit(100)
    .lean();

  const entries = users.map((u, i) => ({
    rank: i + 1,
    wallet: u.wallet,
    displayName: u.displayName ?? undefined,
    avatar: u.avatar ?? undefined,
    xp: u.xp,
    level: getLevel(u.xp),
    streak: u.streak.current,
  }));

  return NextResponse.json(entries);
}
