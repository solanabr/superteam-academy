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

        const { getCached } = await import("@/lib/cache");

        const data = await getCached(`user:${wallet}:profile`, async () => {
            const user = await prisma.user.findUnique({
                where: { walletAddress: wallet },
                select: {
                    id: true,
                    walletAddress: true,
                    profile: true,
                    createdAt: true,
                }
            });

            if (!user) return null;

            // Fetch "real" XP and flags + Credentials in parallel
            const identifier = process.env.NEXT_PUBLIC_USE_ONCHAIN === "true" ? wallet : user.id;

            const [progressResult, credentialsResult] = await Promise.allSettled([
                learningProgressService.getProgress(identifier),
                prisma.credential.findMany({
                    where: { userId: user.id },
                    select: {
                        id: true,
                        trackId: true,
                        trackName: true,
                        mintAddress: true,
                        earnedAt: true
                    },
                    orderBy: { earnedAt: 'desc' }
                })
            ]);

            const progress = progressResult.status === "fulfilled" ? progressResult.value : null;
            const credentials = credentialsResult.status === "fulfilled" ? credentialsResult.value : [];

            return {
                user,
                xp: progress?.xp ?? 0,
                level: getLevelFromXp(progress?.xp ?? 0),
                achievementFlags: progress?.achievementFlags ? Array.from(progress.achievementFlags) : [],
                credentials,
            };
        }, { ttl: 60 });

        if (!data) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (e) {
        console.error("Public profile fetch error:", e);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
