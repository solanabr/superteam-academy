import { NextRequest, NextResponse } from "next/server";
import { ensureUser, getLevel } from "@/lib/db/helpers";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json(0);

  const user = await ensureUser(userId);
  return NextResponse.json(getLevel(user.xp));
}
