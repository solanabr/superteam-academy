import { NextRequest, NextResponse } from "next/server";
import { ensureUser } from "@/lib/db/helpers";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json([]);

  const user = await ensureUser(userId);
  return NextResponse.json(user.completedPractice);
}
