import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userChallengeId, walletAddress } = body;

    if (!userChallengeId || !walletAddress) {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Если ID виртуальный (нажали хаком в DevTools), игнорируем
    if (userChallengeId.startsWith('virtual_')) {
        return NextResponse.json({ error: "Challenge not completed yet" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { walletAddress } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // 1. Находим UserChallenge
    const userChallenge = await prisma.userChallenge.findUnique({
        where: { id: userChallengeId },
        include: { challenge: true } // Нам нужна награда из оригинального задания
    });

    if (!userChallenge) {
        return NextResponse.json({ error: "Quest progress not found" }, { status: 404 });
    }

    // 2. Проверки (защита от читеров)
    if (!userChallenge.isCompleted) {
        return NextResponse.json({ error: "Quest is not completed yet" }, { status: 400 });
    }
    if (userChallenge.claimedAt) {
        return NextResponse.json({ error: "Reward already claimed" }, { status: 400 });
    }
    if (userChallenge.userId !== user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 3. Выполняем транзакцию: Помечаем как собранное + Выдаем XP + Пишем в историю
    const xpReward = userChallenge.challenge.xpReward;

    await prisma.$transaction(async (tx) => {
        // А. Помечаем как Claimed
        await tx.userChallenge.update({
            where: { id: userChallengeId },
            data: { claimedAt: new Date() }
        });

        // Б. Начисляем XP
        await tx.user.update({
            where: { id: user.id },
            data: { xp: { increment: xpReward } }
        });

        // В. Пишем в историю уведомлений
        await tx.xPHistory.create({
            data: {
                userId: user.id,
                amount: xpReward,
                source: "bonus", // Это бонус/дейлик
                description: `Claimed Daily Quest: ${userChallenge.challenge.title}`
            }
        });
    });

    return NextResponse.json({ success: true, reward: xpReward });

  } catch (error: any) {
    console.error("Claim error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}