import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: Получить комментарии для конкретного урока
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    const lessonIndex = parseInt(searchParams.get("lessonIndex") || "-1");

    if (!courseId || lessonIndex === -1) {
        return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    const discussions = await prisma.discussion.findMany({
        where: { courseId, lessonIndex, parentId: null },
        orderBy: { createdAt: 'desc' }, // Новые сверху
        include: {
            // Подтягиваем инфу о юзере, чтобы нарисовать аватарку
            user: {
                select: {
                    username: true,
                    walletAddress: true,
                    githubHandle: true,
                    image: true,
                    role: true // Чтобы подсветить админов
                }
            }
        }
    });

    return NextResponse.json(discussions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Создать новый комментарий
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { courseId, lessonIndex, content, walletAddress, parentId } = body; 

    // Авторизация
    let userId = null;
    if (session?.user) {
        // @ts-ignore
        userId = session.user.id;
    } else if (walletAddress) {
        const user = await prisma.user.findUnique({ where: { walletAddress } });
        if (user) userId = user.id;
    }

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!content || content.trim() === "") {
        return NextResponse.json({ error: "Content cannot be empty" }, { status: 400 });
    }

    const newComment = await prisma.discussion.create({
        data: {
            userId: userId,
            courseId: courseId,
            lessonIndex: lessonIndex,
            content: content,
            parentId: parentId || null // Если есть parentId, значит это ответ
        },
        include: {
            user: { select: { username: true, walletAddress: true, githubHandle: true, image: true, role: true } }
        }
    });

    return NextResponse.json({ success: true, comment: newComment });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}