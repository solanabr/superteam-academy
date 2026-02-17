import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server/auth-adapter";
import { getRecentActivity } from "@/lib/server/activity-store";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const items = getRecentActivity(user.walletAddress);
  return NextResponse.json({ items });
}
