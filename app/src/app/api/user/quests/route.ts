import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) return NextResponse.json([]);

    const user = await prisma.user.findUnique({ where: { walletAddress: wallet } });
    if (!user) return NextResponse.json([]);

    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Получаем все активные глобальные задания
    const activeChallenges = await prisma.challenge.findMany({
        where: { isActive: true }
    });

    // 2. Получаем прогресс юзера по этим заданиям НА СЕГОДНЯ
    const userChallenges = await prisma.userChallenge.findMany({
        where: {
            userId: user.id,
            dateKey: todayStr
        }
    });

    // 3. Формируем ответ, объединяя данные
    const responseData = activeChallenges.map(challenge => {
        // Ищем, есть ли прогресс
        const progress = userChallenges.find(uc => uc.challengeId === challenge.id);

        return {
            // Если прогресса еще нет, мы должны создать фейковый ID для UI
            // Но кнопка Claim все равно недоступна, пока isCompleted не станет true (а это случится только при реальной записи)
            id: progress?.id || `virtual_${challenge.id}`, 
            title: challenge.title,
            xpReward: challenge.xpReward,
            targetCount: challenge.targetCount,
            currentCount: progress?.currentCount || 0,
            isCompleted: progress?.isCompleted || false,
            claimedAt: progress?.claimedAt || null
        };
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("Quests error:", error);
    return NextResponse.json({ error: "Failed to fetch quests" }, { status: 500 });
  }
}