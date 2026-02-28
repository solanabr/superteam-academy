import { NextRequest, NextResponse } from "next/server";
import { ensureUser } from "@/lib/db/helpers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "missing userId" }, { status: 400 });
  }

  const user = await ensureUser(userId);
  return NextResponse.json({
    communityPoints: user.communityPoints,
    endorsementCount: user.endorsementCount,
  });
}
