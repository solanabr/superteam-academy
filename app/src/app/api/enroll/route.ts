import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { learningProgressService } from "@/lib/learning-progress/service";

/** POST /api/enroll — enroll user (by wallet) in a course. Body: { wallet, courseId } */
export async function POST(request: NextRequest) {
  let body: { wallet?: string; courseId?: string; signature?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { wallet, courseId, signature } = body;
  if (!wallet || !courseId) {
    return NextResponse.json({ error: "Missing wallet or courseId" }, { status: 400 });
  }

  const user = await prisma.user.upsert({
    where: { walletAddress: wallet },
    create: { walletAddress: wallet },
    update: {},
    select: { id: true },
  });

  // 1. Trigger Background Invalidation for the user immediately
  const { invalidatePattern } = await import("@/lib/cache");
  await invalidatePattern(`user:${wallet}*`);

  // 2. Handle Enrollment Sync
  if (signature && process.env.NEXT_PUBLIC_USE_ONCHAIN === "true") {
    // Offload confirmation to Inngest for on-chain flows
    const { inngest } = await import("@/lib/inngest/client");
    await inngest.send({
      name: "solana/enrollment.sent",
      data: { signature, wallet, courseId }
    });
    return NextResponse.json({ ok: true, status: "processing" });
  } else {
    // Standard Prisma sync (or fallback if no signature provided)
    const service = learningProgressService;
    const identifier = process.env.NEXT_PUBLIC_USE_ONCHAIN === "true" ? wallet : user.id;
    await service.enroll(identifier, courseId);
    return NextResponse.json({ ok: true, status: "completed" });
  }
}
