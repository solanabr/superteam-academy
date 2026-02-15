import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Thread } from "@/lib/db/models/thread";
import { Reply } from "@/lib/db/models/reply";

export async function POST(req: NextRequest) {
  const { userId, targetId, targetType } = await req.json();
  if (!userId || !targetId || !targetType) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  await connectDB();

  const Model = targetType === "thread" ? Thread : Reply;
  const doc = await Model.findById(targetId);
  if (!doc) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const idx = doc.upvotes.indexOf(userId);
  if (idx === -1) {
    doc.upvotes.push(userId);
  } else {
    doc.upvotes.splice(idx, 1);
  }
  await doc.save();

  return NextResponse.json({ ok: true, upvotes: doc.upvotes });
}
