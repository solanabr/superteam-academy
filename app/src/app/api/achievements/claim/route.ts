
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createLearningProgressService } from "@/lib/learning-progress/prisma-impl";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { learningProgressService } from "@/lib/learning-progress/service";

/** 
 * POST /api/achievements/claim
 * Body: { wallet: string; achievementId: string }
 */
export async function POST(request: NextRequest) {
    let body: { wallet?: string; achievementId?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { wallet, achievementId } = body;

    if (!wallet || !achievementId) {
        return NextResponse.json(
            { error: "Missing wallet or achievementId" },
            { status: 400 }
        );
    }

    const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (!achievement) {
        return NextResponse.json({ error: "Invalid achievement ID" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where: { walletAddress: wallet },
        select: { id: true },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const service = learningProgressService;

    try {
        const identifier = process.env.NEXT_PUBLIC_USE_ONCHAIN === "true" ? wallet : user.id;
        const claimed = await service.claimAchievement(identifier, achievementId);
        return NextResponse.json({ ok: true, claimed });
    } catch (e: any) {
        return NextResponse.json(
            { error: e?.message ?? "Failed to claim achievement" },
            { status: 400 }
        );
    }
}
