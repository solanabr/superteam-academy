// app/src/app/api/forum/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Получаем только "родительские" вопросы (не ответы)
    const threads = await prisma.discussion.findMany({
      where: { parentId: null },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { username: true, walletAddress: true, image: true, role: true }
        },
        _count: {
          select: { replies: true } // Считаем количество ответов
        }
      }
    });

    // Для красоты UI нам нужно название курса, а не только его slug.
    // Сделаем один запрос за курсами и сматчим их.
    const courseSlugs = Array.from(new Set(threads.map(t => t.courseId)));
    const courses = await prisma.course.findMany({
        where: { slug: { in: courseSlugs } },
        select: { slug: true, title: true }
    });

    const formattedThreads = threads.map(thread => ({
        ...thread,
        courseTitle: courses.find(c => c.slug === thread.courseId)?.title || thread.courseId
    }));

    return NextResponse.json(formattedThreads);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}