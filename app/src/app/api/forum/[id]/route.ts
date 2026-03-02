// app/src/app/api/forum/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // 1. Получаем главный вопрос (Thread)
    const thread = await prisma.discussion.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { username: true, walletAddress: true, image: true, role: true } }
      }
    });

    if (!thread) {
        return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // 2. Получаем все ответы
    const replies = await prisma.discussion.findMany({
        where: { parentId: params.id },
        orderBy: { createdAt: 'asc' }, // Ответы по порядку (старые сверху)
        include: {
            user: { select: { username: true, walletAddress: true, image: true, role: true } }
        }
    });

    // Обогащаем названием курса
    const course = await prisma.course.findUnique({
        where: { slug: thread.courseId },
        select: { title: true }
    });

    return NextResponse.json({
        ...thread,
        courseTitle: course?.title || thread.courseId,
        replies: replies
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}