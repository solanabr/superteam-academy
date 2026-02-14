import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/user";
import { getLevel } from "@/lib/db/helpers";

export async function GET() {
  await connectDB();
  const users = await User.find({ xp: { $gt: 0 }, wallet: { $ne: "guest" } })
    .sort({ xp: -1 })
    .limit(100)
    .lean();

  const entries = users.map((u, i) => ({
    rank: i + 1,
    wallet: u.wallet,
    displayName: u.displayName ?? undefined,
    xp: u.xp,
    level: getLevel(u.xp),
    streak: u.streak.current,
  }));

  return NextResponse.json(entries);
}
