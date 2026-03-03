import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** POST /api/unenroll — delete enrollment user (by wallet) in a course. Body: { wallet, courseId } */
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

    const user = await prisma.user.findUnique({
        where: { walletAddress: wallet }
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 0. Guard: Do not allow unenrollment (deletion) if course is completed
    const existing = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: user.id, courseId } }
    });

    if (existing?.completedAt) {
        return NextResponse.json({
            error: "Cannot unenroll from a completed course. Use 'Reclaim Rent' instead to close your on-chain account while preserving your achievement."
        }, { status: 403 });
    }

    // 1. Delete from Prisma
    await prisma.enrollment.deleteMany({
        where: {
            userId: user.id,
            courseId: courseId
        }
    });

    // 2. Invalidate Cache immediately
    const { invalidatePattern } = await import("@/lib/cache");
    await invalidatePattern(`user:${wallet}*`);

    return NextResponse.json({ ok: true });
}
