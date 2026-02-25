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
