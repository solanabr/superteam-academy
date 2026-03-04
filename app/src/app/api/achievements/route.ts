// app/src/app/api/achievements/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  // Получаем все ачивки, отсортированные по сложности или имени
  const achievements = await prisma.achievement.findMany({
    orderBy: { xpReward: 'asc' }
  });
  return NextResponse.json(achievements);
}