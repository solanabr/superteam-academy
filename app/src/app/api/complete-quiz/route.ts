import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { inngest } from "@/lib/inngest/client";

/**
 * POST /api/complete-quiz
 * Body: { walletAddress: string; courseId: string; moduleId: string; quizId: string; xpReward?: number }
 *
 * Marks a quiz as properly completed and distributes XP token balances via Inngest.
 */
export async function POST(request: NextRequest) {
    let body: { walletAddress?: string; courseId?: string; moduleId?: string; quizId?: string; xpReward?: number };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { walletAddress, courseId, moduleId, quizId, xpReward } = body;

    if (!walletAddress || !courseId || !moduleId || !quizId) {
        return NextResponse.json(
            { error: "Missing walletAddress, courseId, moduleId, or quizId" },
            { status: 400 }
        );
    }

    const user = await prisma.user.findUnique({
        where: { walletAddress },
        select: { id: true },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    try {
        // Use Inngest for background processing (Tier 3 Performance Strategy)
        // This handles DB sync and cache invalidation asynchronously.
        await inngest.send({
            name: "academy/quiz.completed",
            data: {
                wallet: walletAddress,
                courseId,
                moduleId,
                quizId,
                xpReward: xpReward ?? 50
            }
        });
    } catch (e: any) {
        console.error("[complete-quiz] Inngest dispatch failed:", e);
        return NextResponse.json(
            { error: e?.message ?? "Failed to dispatch quiz completion" },
            { status: 500 }
        );
    }

    return NextResponse.json({ ok: true });
}
