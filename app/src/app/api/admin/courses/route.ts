// app/src/app/api/admin/courses/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { getServerProgram, getBackendWallet } from "@/lib/server";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { PROGRAM_ID } from "@/lib/constants";
import { BN } from "@coral-xyz/anchor";

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
    const { slug, title, description, difficulty, xpPerLesson, imageUrl, isPublished, modules } = data;

    // Подсчет общего количества уроков (нужно для блокчейна)
    let totalLessons = 0;
    if (modules && Array.isArray(modules)) {
        modules.forEach(mod => {
            if (mod.lessons) totalLessons += mod.lessons.length;
        });
    }

    // ==========================================
    // БЛОКЧЕЙН ЛОГИКА (Если курс публикуется)
    // ==========================================
    if (isPublished) {
        console.log(`[Admin] Attempting to publish/update course ${slug} to blockchain...`);
        try {
            const program = getServerProgram();
            const backendWallet = getBackendWallet();
            
            const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
            const [coursePda] = PublicKey.findProgramAddressSync([Buffer.from("course"), Buffer.from(slug)], PROGRAM_ID);
            
            // Проверяем, существует ли курс
            const courseExists = await program.account.course.fetchNullable(coursePda);
            const contentTxId = new Array(32).fill(0); // Заглушка для Arweave
            
            let diffNum = 1;
            if (difficulty === "Intermediate") diffNum = 2;
            if (difficulty === "Advanced") diffNum = 3;

            // Форматируем XP в BN, так как в updateCourse IDL часто требует BN, даже если в createCourse - обычное число.
            // Но чтобы быть в безопасности, передадим числа, как в оригинальном скрипте.
            const xpValue = parseInt(xpPerLesson) || 50;

            if (!courseExists) {
                // СОЗДАНИЕ НОВОГО КУРСА
                console.log(`[Admin] Creating NEW course PDA for: ${slug}`);
                await program.methods.createCourse({
                    courseId: slug,
                    creator: backendWallet.publicKey,
                    contentTxId: contentTxId,
                    lessonCount: totalLessons,
                    difficulty: diffNum,
                    xpPerLesson: new BN(xpValue), // В оригинале было 100, но TypeScript IDL часто хочет BN. 
                                                  // Оставим BN, если будет ругаться, уберем.
                    trackId: 1, 
                    trackLevel: 1,
                    prerequisite: null,
                    creatorRewardXp: new BN(50), 
                    minCompletionsForReward: 10,  // Оставим как число, как в оригинале
                })
                .accounts({
                    course: coursePda,
                    config: configPda,
                    authority: backendWallet.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .signers([backendWallet.payer])
                .rpc();
                
                console.log(`[Admin] ✅ Course ${slug} created on-chain!`);
                
            } else {
                // ОБНОВЛЕНИЕ СУЩЕСТВУЮЩЕГО КУРСА
                console.log(`[Admin] Course ${slug} exists. UPDATING on-chain data...`);
                
                // ВАЖНО: Смотрим в SPEC.md инструкцию update_course
                await program.methods.updateCourse({
                    newContentTxId: contentTxId,
                    newIsActive: true,
                    newXpPerLesson: new BN(xpValue),
                    newCreatorRewardXp: null, // Не меняем
                    newMinCompletionsForReward: null, // Не меняем
                })
                .accounts({
                    config: configPda,
                    course: coursePda,
                    authority: backendWallet.publicKey,
                })
                .signers([backendWallet.payer])
                .rpc();

                console.log(`[Admin] ✅ Course ${slug} updated on-chain!`);
            }
        } catch (chainError: any) {
            console.error("[Admin] ❌ Blockchain Error:", chainError);
            return NextResponse.json({ error: `Blockchain Error: ${chainError.message}` }, { status: 500 });
        }
    }

    // ==========================================
    // DATABASE ЛОГИКА (Транзакция)
    // ==========================================
    // 1. Создаем/обновляем курс
    const course = await prisma.course.upsert({
        where: { slug: slug },
        update: { title, description, difficulty, xpPerLesson, isPublished, imageUrl },
        create: { slug, title, description, difficulty, xpPerLesson, isPublished, imageUrl }
    });

    // 2. Обрабатываем модули и уроки
    if (modules && Array.isArray(modules)) {
        let globalLessonIndex = 0;

        for (let modIndex = 0; modIndex < modules.length; modIndex++) {
            const mod = modules[modIndex];

            // Находим или создаем модуль. Чтобы не было дублей при обновлении, 
            // мы ищем его по courseId и title (в идеале нужно было бы передавать ID с фронта).
            // Но для хакатона мы можем просто искать по title внутри курса.
            let dbModule = await prisma.courseModule.findFirst({
                where: { courseId: course.id, title: mod.title }
            });

            if (dbModule) {
                dbModule = await prisma.courseModule.update({
                    where: { id: dbModule.id },
                    data: { order: modIndex }
                });
            } else {
                dbModule = await prisma.courseModule.create({
                    data: { courseId: course.id, title: mod.title, order: modIndex }
                });
            }

            if (mod.lessons && Array.isArray(mod.lessons)) {
                for (const lesson of mod.lessons) {
                    
                    // Аналогично ищем урок по title внутри модуля
                    let dbLesson = await prisma.lesson.findFirst({
                        where: { moduleId: dbModule.id, title: lesson.title }
                    });

                    let parsedRules = null;
                    if (lesson.isChallenge && lesson.validationRules) {
                        try {
                            parsedRules = JSON.parse(lesson.validationRules);
                        } catch (e) {
                            console.error("Failed to parse validation rules for", lesson.title);
                        }
                    }

                    if (dbLesson) {
                        await prisma.lesson.update({
                            where: { id: dbLesson.id },
                            data: {
                                content: lesson.content,
                                initialCode: lesson.initialCode,
                                isChallenge: lesson.isChallenge,
                                order: globalLessonIndex,
                                validationRules: parsedRules
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
                                validationRules: parsedRules
                            }
                        });
                    }
                    globalLessonIndex++;
                }
            }
        }
    }

    return NextResponse.json({ success: true, course: course });

  } catch (error: any) {
    console.error("Save course error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}