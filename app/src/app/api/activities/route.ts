import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const wallet = searchParams.get("wallet");
        const limit = parseInt(searchParams.get("limit") || "10", 10);

        if (!wallet) {
            return NextResponse.json(
                { error: "Wallet address is required" },
                { status: 400 }
            );
        }

        const { getCached } = await import("@/lib/cache");

        const formattedActivities = await getCached(`user:${wallet}:activities:${limit}`, async () => {
            const user = await prisma.user.findUnique({
                where: { walletAddress: wallet },
                select: { id: true }
            });

            if (!user) return [];

            const activities = await prisma.xpEvent.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: "desc" },
                take: limit,
                select: {
                    id: true,
                    amount: true,
                    source: true,
                    createdAt: true,
                }
            });

            return activities.map((act: { id: string; amount: number; source: string; createdAt: Date }) => ({
                id: act.id,
                title: formatTitle(act.source, act.amount),
                description: formatDescription(act.source),
                xp: act.amount,
                timestamp: act.createdAt.toISOString()
            }));
        }, { ttl: 30 });

        return NextResponse.json({ activities: formattedActivities });
    } catch (error) {
        console.error("Activities API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

function formatTitle(source: string, amount: number): string {
    if (source.includes("achievement:")) return "Achievement Unlocked";
    if (source.startsWith("quiz:")) return "Completed a Quiz";
    if (source.includes("lesson")) return "Completed a Lesson";
    if (source.includes("course_completion") || source.includes("graduation")) return "Completed a Course";
    if (source.includes("bonus")) return "Earned a Bonus";
    return "Activity";
}

function formatDescription(source: string): string {
    if (source.startsWith("achievement:")) {
        const id = source.split(":")[1];
        if (id === "easter-egg") return "Found a secret easter egg!";
        return "Earned a new achievement badge.";
    }
    if (source.startsWith("quiz:")) return "Knowledge tested and rewarded!";
    if (source.includes("lesson")) return "Kept the streak going!";
    if (source.includes("course_completion") || source.includes("graduation")) return "Course mastered!";
    if (source.includes("bonus")) return "Extra effort rewarded!";
    return "Keep it up.";
}
