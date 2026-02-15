import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Enrollment } from "@/lib/db/models/enrollment";

// MongoDB sync endpoint — called after client-side on-chain unenroll tx succeeds
export async function POST(req: NextRequest) {
  const { userId, courseId } = await req.json();
  if (!userId || !courseId) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  await connectDB();
  await Enrollment.deleteOne({ userId, courseId });
  return NextResponse.json({ ok: true });
}
