import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { toUint8Array, isBitSet } from "@/lib/bitmap";

/**
 * GET /api/achievements?wallet=<address>
 * Returns the list of achievements with their claimed status for the user.
 */
export async function GET(request: NextRequest) {
    const wallet = request.nextUrl.searchParams.get("wallet");
    if (!wallet) {
        return NextResponse.json({ error: "Missing wallet" }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { walletAddress: wallet },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { getCached } = await import("@/lib/cache");
        const achievements = await getCached(`user:${wallet}:achievements`, async () => {
            const progress = await prisma.progress.findUnique({
                where: { userId: user.id },
                select: { achievementFlags: true },
            });

            // Map each achievement to include claimed status
            const flags = progress?.achievementFlags
                ? toUint8Array(progress.achievementFlags)
                : new Uint8Array(4); // default empty flags

            return ACHIEVEMENTS.map((a) => ({
                id: a.id,
                title: a.title,
                description: a.description,
                icon: a.icon,
                xpReward: a.xp,
                claimed: isBitSet(flags, a.bitIndex),
            }));
        }, { ttl: 60 });

        return NextResponse.json(achievements);
    } catch (error: any) {
        console.error("GET /api/achievements error:", error?.message ?? error);
        return NextResponse.json(
            { error: "Service unavailable" },
            { status: 503 }
        );
    }
}
