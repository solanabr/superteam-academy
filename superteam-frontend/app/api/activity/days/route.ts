import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server/auth-adapter";
import { getActivityDays } from "@/lib/server/activity-store";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const daysBack = Math.min(
    365,
    Math.max(30, Number(searchParams.get("days")) || 365),
  );
  const days = await getActivityDays(user.walletAddress, daysBack);
  return NextResponse.json({ days });
}
