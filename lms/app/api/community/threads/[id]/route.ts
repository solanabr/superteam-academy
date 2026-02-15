import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Thread } from "@/lib/db/models/thread";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await connectDB();

  const thread = await Thread.findByIdAndUpdate(
    id,
    { $inc: { views: 1 } },
    { new: true }
  ).lean();

  if (!thread) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json(thread);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "missing userId" }, { status: 400 });
  }

  await connectDB();

  const thread = await Thread.findById(id);
  if (!thread) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (thread.author !== userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }

  await Thread.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
