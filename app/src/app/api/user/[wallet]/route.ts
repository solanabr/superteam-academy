import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { learningProgressService } from "@/lib/learning-progress/service";
import { getLevelFromXp } from "@/lib/ranks";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ wallet: string }> }
) {
    try {
        const { wallet } = await params;
        if (!wallet) return NextResponse.json({ error: "Wallet required" }, { status: 400 });

        const user = await prisma.user.findUnique({
            where: { walletAddress: wallet },
            select: {
                id: true,
                walletAddress: true,
                profile: true,
                createdAt: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Fetch "real" XP and flags via the service architecture
        const identifier = process.env.NEXT_PUBLIC_USE_ONCHAIN === "true" ? wallet : user.id;
        const progress = await learningProgressService.getProgress(identifier);

        const xp = progress?.xp ?? 0;
        const level = getLevelFromXp(xp);
        const achievementFlags = progress?.achievementFlags ? Array.from(progress.achievementFlags) : [];

        // Fetch passed courses and distinct credentials
        const credentials = await prisma.credential.findMany({
            where: { userId: user.id },
            select: {
                id: true,
                trackId: true,
                trackName: true,
                mintAddress: true,
                earnedAt: true
            },
            orderBy: { earnedAt: 'desc' }
        });

        return NextResponse.json({
            user,
            xp,
            level,
            achievementFlags,
            credentials,
        });
    } catch (e) {
        console.error("Public profile fetch error:", e);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
