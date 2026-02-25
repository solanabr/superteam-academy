import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");
  const courseId = searchParams.get("courseId");

  if (!wallet || !courseId) return NextResponse.json([]);

  const user = await prisma.user.findUnique({ where: { walletAddress: wallet } });
  if (!user) return NextResponse.json([]);

  // Получаем все пройденные уроки для этого курса
  const progress = await prisma.lessonProgress.findMany({
    where: {
      userId: user.id,
      courseId: courseId,
      status: "completed"
    },
    select: { lessonIndex: true }
  });

  // Возвращаем массив индексов: [0, 1]
  return NextResponse.json(progress.map(p => p.lessonIndex));
}