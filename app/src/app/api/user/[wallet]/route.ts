import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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
            // DB-First: Fetch user + progress + credentials in a single parallel query
            const user = await prisma.user.findUnique({
                where: { walletAddress: wallet },
                select: {
                    id: true,
                    walletAddress: true,
                    profile: true,
                    preferences: true,
                    createdAt: true,
                    progress: {
                        select: {
                            xp: true,
                            achievementFlags: true,
                        }
                    }
                }
            });

            if (!user) return null;

            // Fetch credentials in parallel (already fast — Prisma only)
            const credentials = await prisma.credential.findMany({
                where: { userId: user.id },
                select: {
                    id: true,
                    courseId: true,
                    courseName: true,
                    trackId: true,
                    trackName: true,
                    level: true,
                    coursesCompleted: true,
                    totalXpEarned: true,
                    mintAddress: true,
                    verificationUrl: true,
                    earnedAt: true
                },
                orderBy: { earnedAt: 'desc' }
            });

            const xp = user.progress?.xp ?? 0;

            return {
                user: {
                    id: user.id,
                    walletAddress: user.walletAddress,
                    profile: user.profile,
                    preferences: user.preferences,
                    createdAt: user.createdAt,
                },
                xp,
                level: getLevelFromXp(xp),
                achievementFlags: user.progress?.achievementFlags ? Array.from(user.progress.achievementFlags) : [],
                credentials,
            };
        }, { ttl: 30 });

        if (!data) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (e) {
        console.error("Public profile fetch error:", e);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
