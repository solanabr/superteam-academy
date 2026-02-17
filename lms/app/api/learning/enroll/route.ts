import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Enrollment } from "@/lib/db/models/enrollment";
import { ensureUser } from "@/lib/db/helpers";
import { SAMPLE_COURSES } from "@/lib/data/sample-courses";
import { fetchSanityCourse } from "@/lib/services/sanity-courses";
import { getBackendSigner } from "@/lib/solana/backend-signer";
import { sendMemoTx } from "@/lib/solana/transactions";

export async function POST(req: NextRequest) {
  const { userId, courseId, txSignature: clientTxSignature } = await req.json();
  if (!userId || !courseId) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  await connectDB();
  await ensureUser(userId);

  const existing = await Enrollment.findOne({ userId, courseId });
  if (existing) return NextResponse.json({ ok: true, txSignature: null });

  const sanityCourse = await fetchSanityCourse(courseId);
  const course = sanityCourse ?? SAMPLE_COURSES.find((c) => c.id === courseId || c.slug === courseId);
  if (!course) return NextResponse.json({ error: "course not found" }, { status: 404 });

  // Use client-provided tx signature if available, otherwise send memo tx as fallback
  let txSignature: string | null = clientTxSignature ?? null;
  if (!txSignature) {
    try {
      const backendKeypair = getBackendSigner();
      txSignature = await sendMemoTx(backendKeypair, {
        event: "enroll",
        wallet: userId,
        courseId,
        courseTitle: course.title,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // no SOL or signer not configured
    }
  }

  await Enrollment.create({
    userId,
    courseId,
    totalLessons: course.lessonCount,
    enrollTxHash: txSignature ?? undefined,
  });

  return NextResponse.json({ ok: true, txSignature });
}
