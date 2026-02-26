import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { learningProgressService as service } from "@/lib/learning-progress/service";

/** 
 * POST /api/graduation
 * Body: { wallet: string; courseId: string; lessonCount: number }
 */
export async function POST(request: NextRequest) {
    console.log("[api/graduation] Incoming request received");

    let body: { wallet?: string; courseId?: string; lessonCount?: number };
    try {
        body = await request.json();
        console.log(`[api/graduation] Request body: ${JSON.stringify(body)}`);
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { wallet, courseId, lessonCount } = body;

    if (!wallet || !courseId || typeof lessonCount !== "number") {
        console.error(`[api/graduation] Validation failed: wallet=${wallet}, courseId=${courseId}, lessonCount=${lessonCount}`);
        return NextResponse.json(
            { error: "Missing required fields" },
            { status: 400 }
        );
    }

    const user = await prisma.user.findUnique({
        where: { walletAddress: wallet },
        select: { id: true, role: true },
    });

    if (!user) {
        console.error(`[api/graduation] User not found for wallet: ${wallet}`);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    try {
        console.log(`[api/graduation] Starting graduation for user ${user.id} (Wallet: ${wallet}), Course: ${courseId}`);

        const identifier = process.env.NEXT_PUBLIC_USE_ONCHAIN === "true" ? wallet : user.id;

        // 0. Sync completion status and award 500 XP in Prisma Transactionally
        await prisma.$transaction([
            prisma.enrollment.updateMany({
                where: { userId: user.id, courseId },
                data: { completedAt: new Date() }
            }),
            prisma.progress.update({
                where: { userId: user.id },
                data: { xp: { increment: 500 } }
            }),
            prisma.xpEvent.create({
                data: {
                    userId: user.id,
                    amount: 500,
                    source: "graduation"
                }
            })
        ]);
        console.log("[api/graduation] Prisma updated (Completion + 500 XP)");

        // Final Cache Clear - IMPORTANT: Must happen even in on-chain mode 
        // because the local Prisma state has changed (completedAt set).
        try {
            const { invalidatePattern } = await import("@/lib/cache");
            await invalidatePattern(`user:${wallet}*`);
            console.log(`[api/graduation] Cache invalidated for user ${wallet}`);
        } catch (e) {
            console.error("[api/graduation] Cache invalidation failed:", e);
        }

        if (process.env.NEXT_PUBLIC_USE_ONCHAIN === "true") {
            const { inngest } = await import("@/lib/inngest/client");
            console.log(`[api/graduation] Dispatching background graduation for user ${wallet}, Course: ${courseId}`);

            await inngest.send({
                name: "solana/graduation.started",
                data: {
                    wallet: wallet,
                    courseId: courseId,
                    lessonCount: lessonCount
                }
            });

            return NextResponse.json({
                ok: true,
                status: "processing",
                message: "Graduation started. Your certificate will appear in your profile shortly. If the certificate doesn't appear, please regenerate."
            });
        }

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        console.error(`[api/graduation] FATAL ERROR: ${e.message}`, e.stack);
        return NextResponse.json(
            { error: e?.message ?? "Failed to graduate" },
            { status: 500 }
        );
    }
}
