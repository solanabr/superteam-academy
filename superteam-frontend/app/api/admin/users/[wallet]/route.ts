import { NextResponse } from "next/server";
import { checkPermission } from "@/lib/server/admin-auth";
import { getLearnerProfileOnChain } from "@/lib/server/academy-chain-read";
import { getActivityData } from "@/lib/server/activity-store";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

type Params = { params: Promise<{ wallet: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await checkPermission("users.read");
  if (!user) return unauthorized();
  const { wallet } = await params;
  const [profile, activity] = await Promise.all([
    getLearnerProfileOnChain(wallet),
    getActivityData(wallet, 90),
  ]);
  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({
    profile: {
      wallet: profile.authority,
      level: profile.level,
      xp: profile.xpTotal,
      streak: profile.streakCurrent,
      streakLongest: profile.streakLongest,
      lastActivityTs: profile.lastActivityTs,
      address: profile.address,
    },
    activity: activity.days.slice(-90),
    recentActivity: activity.recentActivity,
  });
}
