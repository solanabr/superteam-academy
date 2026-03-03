// app/src/app/api/creator/courses/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: Получить только СВОИ курсы
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authorId = searchParams.get("authorId");
    if (!authorId) return NextResponse.json([]);

    const courses = await prisma.course.findMany({
        where: { authorId: authorId },
        include: { modules: true },
        orderBy: { updatedAt: 'desc' }
    });
    return NextResponse.json(courses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Сохранить черновик или отправить на ревью
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const data = await request.json();
    // @ts-ignore

    let userId = null;
    if (session?.user) {
        // @ts-ignore
        userId = session.user.id;
    } else if (data.walletAddress) {
        const user = await prisma.user.findUnique({ where: { walletAddress: data.walletAddress } });
        if (user) userId = user.id;
    }

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    
    const { slug, title, description, difficulty, xpPerLesson, imageUrl, status, modules } = data;

    // Защита: юзер не может сам поставить статус APPROVED
    const safeStatus = (status === 'PENDING' || status === 'DRAFT') ? status : 'DRAFT';

    const result = await prisma.$transaction(async (tx) => {
        // 1. Проверяем, существует ли курс, и является ли юзер его автором
        const existingCourse = await tx.course.findUnique({ where: { slug } });
        if (existingCourse && existingCourse.authorId !== userId && existingCourse.authorId !== null) {
            throw new Error("Slug is already taken by another user.");
        }


        if (existingCourse && existingCourse.status === 'APPROVED') {
            throw new Error("Cannot edit an approved course.");
        }

        const course = await tx.course.upsert({
            where: { slug: slug },
            update: { title, description, difficulty, xpPerLesson, status: safeStatus, imageUrl },
            create: { slug, title, description, difficulty, xpPerLesson, status: safeStatus, imageUrl, authorId: userId }
        });

        // 2. Обработка модулей (аналогично админскому API)
        if (modules && Array.isArray(modules)) {
            let globalLessonIndex = 0;
            for (let modIndex = 0; modIndex < modules.length; modIndex++) {
                const mod = modules[modIndex];
                let dbModule = await tx.courseModule.findFirst({ where: { courseId: course.id, title: mod.title } });
                
                if (dbModule) {
                    dbModule = await tx.courseModule.update({ where: { id: dbModule.id }, data: { order: modIndex } });
                } else {
                    dbModule = await tx.courseModule.create({ data: { courseId: course.id, title: mod.title, order: modIndex } });
                }

                if (mod.lessons && Array.isArray(mod.lessons)) {
                    for (const lesson of mod.lessons) {
                        
                        // БЕЗОПАСНЫЙ ПАРСИНГ JSON НА БЭКЕНДЕ
                        let parsedRules = null;
                        if (lesson.isChallenge && lesson.validationRules) {
                            try { 
                                // Если фронтенд прислал строку, парсим. Если уже объект, оставляем.
                                parsedRules = typeof lesson.validationRules === 'string' 
                                    ? JSON.parse(lesson.validationRules) 
                                    : lesson.validationRules;
                            } catch (e) {
                                console.error(`Invalid JSON rules in lesson ${lesson.title}`);
                                // Если JSON кривой, оставляем null, чтобы не сломать сохранение всего курса
                            }
                        }

                        let dbLesson = await prisma.lesson.findFirst({ 
                            where: { moduleId: dbModule.id, title: lesson.title } 
                        });

                        if (dbLesson) {
                            await prisma.lesson.update({
                                where: { id: dbLesson.id },
                                data: { 
                                    content: lesson.content, 
                                    initialCode: lesson.initialCode, 
                                    isChallenge: lesson.isChallenge, 
                                    order: globalLessonIndex, 
                                    validationRules: parsedRules // Сохраняем объект Json
                                }
                            });
                        } else {
                            await prisma.lesson.create({
                                data: { 
                                    moduleId: dbModule.id, 
                                    title: lesson.title, 
                                    content: lesson.content, 
                                    initialCode: lesson.initialCode, 
                                    isChallenge: lesson.isChallenge, 
                                    order: globalLessonIndex, 
                                    validationRules: parsedRules // Сохраняем объект Json
                                }
                            });
                        }
                        globalLessonIndex++;
                    }
                }
            }
        }
        return course;
    });

    return NextResponse.json({ success: true, course: result });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}