// app/src/app/api/user/quests/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) return NextResponse.json({ daily: [], seasonal: [] });

    const user = await prisma.user.findUnique({ where: { walletAddress: wallet } });
    if (!user) return NextResponse.json({ daily: [], seasonal: [] });

    const todayStr = new Date().toISOString().split('T')[0];
    const thisMonthStr = todayStr.substring(0, 7); // "YYYY-MM"

    const activeChallenges = await prisma.challenge.findMany({
        where: { isActive: true }
    });

    const userChallenges = await prisma.userChallenge.findMany({
        where: { userId: user.id }
    });

    const formatQuest = (challenge: any, dateKeyStr: string) => {
        const progress = userChallenges.find(uc => uc.challengeId === challenge.id && uc.dateKey === dateKeyStr);
        return {
            id: progress?.id || `virtual_${challenge.id}_${dateKeyStr}`, 
            title: challenge.title,
            description: challenge.description,
            xpReward: challenge.xpReward,
            targetCount: challenge.targetCount,
            currentCount: progress?.currentCount || 0,
            isCompleted: progress?.isCompleted || false,
            claimedAt: progress?.claimedAt || null
        };
    };

    // Разделяем на Daily и Monthly
    const dailyQuests = activeChallenges
        .filter(c => c.period === "DAILY")
        .map(c => formatQuest(c, todayStr));

    const seasonalQuests = activeChallenges
        .filter(c => c.period === "MONTHLY")
        .map(c => formatQuest(c, thisMonthStr));

    return NextResponse.json({ daily: dailyQuests, seasonal: seasonalQuests });

  } catch (error) {
    console.error("Quests error:", error);
    return NextResponse.json({ error: "Failed to fetch quests" }, { status: 500 });
  }
}