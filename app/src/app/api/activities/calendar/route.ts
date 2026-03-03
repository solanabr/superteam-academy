import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const wallet = searchParams.get("wallet");

        if (!wallet) {
            return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
        }

        const { getCached } = await import("@/lib/cache");

        const activeDays = await getCached(`user:${wallet}:calendar`, async () => {
            const user = await prisma.user.findUnique({
                where: { walletAddress: wallet },
                select: { id: true }
            });

            if (!user) return [];

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const activities = await prisma.xpEvent.findMany({
                where: {
                    userId: user.id,
                    createdAt: {
                        gte: thirtyDaysAgo
                    }
                },
                select: { createdAt: true }
            });

            return Array.from(new Set(activities.map(act => {
                return act.createdAt.toISOString();
            })));
        }, { ttl: 60 });

        return NextResponse.json({ activeDays });
    } catch (error) {
        console.error("Calendar API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
