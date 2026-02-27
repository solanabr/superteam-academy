// app/src/app/api/admin/courses/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: Получить список всех курсов для админки
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const user = await prisma.user.findUnique({ where: { id: session?.user?.id } });
    
    if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const courses = await prisma.course.findMany({
        include: {
            modules: {
                include: { lessons: true },
                orderBy: { order: 'asc' }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(courses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Создать или обновить курс целиком
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const user = await prisma.user.findUnique({ where: { id: session?.user?.id } });
    
    if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    
    // Используем транзакцию, чтобы обновить всю структуру атомарно
    const result = await prisma.$transaction(async (tx) => {
        // 1. Создаем или обновляем сам Курс
        const course = await tx.course.upsert({
            where: { slug: data.slug },
            update: {
                title: data.title,
                description: data.description,
                difficulty: data.difficulty,
                xpPerLesson: data.xpPerLesson,
                isPublished: data.isPublished,
                imageUrl: data.imageUrl
            },
            create: {
                slug: data.slug,
                title: data.title,
                description: data.description,
                difficulty: data.difficulty,
                xpPerLesson: data.xpPerLesson,
                isPublished: data.isPublished,
                imageUrl: data.imageUrl
            }
        });

        // 2. Обрабатываем модули и уроки
        // Для простоты (и чтобы не писать сложную логику синхронизации удалений),
        // при апдейте через админку мы удаляем старые модули и создаем новые,
        // либо аккуратно апдейтим.
        // ВАЖНО: Удаление модулей удалит и LessonProgress пользователей! 
        // Поэтому мы делаем безопасный upsert.

        if (data.modules && Array.isArray(data.modules)) {
            let globalLessonIndex = 0; // Сквозной индекс для блокчейна

            for (const [modIndex, mod] of data.modules.entries()) {
                const dbModule = await tx.courseModule.upsert({
                    // Если есть ID, обновляем, иначе создаем (используем составной ключ или просто id)
                    // Для надежности ищем по courseId + title (в реальном проде лучше по ID)
                    where: { id: mod.id || "000000000000000000000000" }, // Dummy ObjectId
                    update: { title: mod.title, order: modIndex },
                    create: { courseId: course.id, title: mod.title, order: modIndex }
                });

                if (mod.lessons && Array.isArray(mod.lessons)) {
                    for (const lesson of mod.lessons) {
                        await tx.lesson.upsert({
                            where: { id: lesson.id || "000000000000000000000000" },
                            update: {
                                title: lesson.title,
                                content: lesson.content,
                                initialCode: lesson.initialCode,
                                isChallenge: lesson.isChallenge,
                                order: globalLessonIndex
                            },
                            create: {
                                moduleId: dbModule.id,
                                title: lesson.title,
                                content: lesson.content,
                                initialCode: lesson.initialCode,
                                isChallenge: lesson.isChallenge,
                                order: globalLessonIndex
                            }
                        });
                        globalLessonIndex++;
                    }
                }
            }
        }
        return course;
    });

    return NextResponse.json({ success: true, course: result });

  } catch (error: any) {
    console.error("Save course error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}