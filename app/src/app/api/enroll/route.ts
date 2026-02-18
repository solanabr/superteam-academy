import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createLearningProgressService } from "@/lib/learning-progress/prisma-impl";

/** POST /api/enroll — enroll user (by wallet) in a course. Body: { wallet, courseId } */
export async function POST(request: NextRequest) {
  let body: { wallet?: string; courseId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { wallet, courseId } = body;
  if (!wallet || !courseId) {
    return NextResponse.json({ error: "Missing wallet or courseId" }, { status: 400 });
  }
  const user = await prisma.user.upsert({
    where: { walletAddress: wallet },
    create: { walletAddress: wallet },
    update: {},
    select: { id: true },
  });
  const service = createLearningProgressService(prisma);
  await service.enroll(user.id, courseId);
  return NextResponse.json({ ok: true });
}
