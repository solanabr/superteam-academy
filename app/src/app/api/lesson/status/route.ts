import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");
  const courseId = searchParams.get("courseId");
  const lessonIndex = parseInt(searchParams.get("lessonIndex") || "-1");

  if (!wallet || !courseId || lessonIndex === -1) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { walletAddress: wallet } });
  if (!user) return NextResponse.json({ status: "not_started" });

  const progress = await prisma.lessonProgress.findUnique({
      where: {
          userId_courseId_lessonIndex: {
              userId: user.id,
              courseId,
              lessonIndex
          }
      }
  });

  return NextResponse.json(progress || { status: "not_started" });
}