import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");

  if (!wallet) return NextResponse.json([]);

  const user = await prisma.user.findUnique({ where: { walletAddress: wallet } });
  if (!user) return NextResponse.json([]);

  // Получаем все завершенные уроки за последние 365 дней
  const activities = await prisma.lessonProgress.findMany({
    where: {
      userId: user.id,
      status: "completed",
      completedAt: {
        gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1))
      }
    },
    select: { completedAt: true }
  });

  // Преобразуем в массив дат строк "YYYY-MM-DD"
  const dates = activities.map(a => a.completedAt?.toISOString().split('T')[0]).filter(Boolean);
  
  // Убираем дубликаты (если прошел 2 урока в один день)
  const uniqueDates = Array.from(new Set(dates));

  return NextResponse.json({ dates: uniqueDates, streak: user.streak });
}