import { NextRequest, NextResponse } from "next/server";
import { ensureUser } from "@/lib/db/helpers";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json(null);

  const user = await ensureUser(userId);
  return NextResponse.json(user.displayName ?? null);
}

export async function PUT(req: NextRequest) {
  const { userId, name, bio, avatar } = await req.json();
  if (!userId) return NextResponse.json({ error: "missing fields" }, { status: 400 });

  const user = await ensureUser(userId);
  if (name !== undefined) user.displayName = name || undefined;
  if (bio !== undefined) user.bio = bio || undefined;
  if (avatar !== undefined) user.avatar = avatar || undefined;
  await user.save();
  return NextResponse.json({ ok: true });
}
