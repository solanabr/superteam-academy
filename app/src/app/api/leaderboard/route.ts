import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Получаем топ-50 пользователей по XP
    // Поскольку MongoDB иногда хранит ID странно, мы просто берем данные
    const leaders = await prisma.user.findMany({
      take: 50,
      orderBy: {
        xp: 'desc',
      },
      select: {
        walletAddress: true,
        username: true,
        xp: true,
        streak: true,
        id: true
      }
    });

    return NextResponse.json(leaders);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}