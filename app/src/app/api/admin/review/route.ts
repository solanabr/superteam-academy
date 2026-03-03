// app/src/app/api/admin/review/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ИМПОРТЫ ДЛЯ БЛОКЧЕЙНА (Они нужны при апруве)
import { getServerProgram, getBackendWallet } from "@/lib/server";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { PROGRAM_ID } from "@/lib/constants";
import { BN } from "@coral-xyz/anchor";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    const user = await prisma.user.findUnique({ where: { id: session?.user?.id } });
    
    if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId, action, comment } = await request.json(); // action: "APPROVE" | "REJECT"

    // 1. Находим курс и все его уроки (чтобы знать lessonCount для блокчейна)
    const course = await prisma.course.findUnique({ 
        where: { id: courseId },
        include: {
            modules: { include: { _count: { select: { lessons: true } } } }
        }
    });

    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    // 2. Обработка Отклонения (REJECT)
    if (action === "REJECT") {
        await prisma.course.update({
            where: { id: courseId },
            data: { 
                status: "REJECTED",
                reviewComment: comment || "Does not meet quality standards."
            }
        });
        return NextResponse.json({ success: true, message: "Course rejected" });
    }

    // 3. Обработка Одобрения (APPROVE) -> Деплой в Блокчейн
    if (action === "APPROVE") {
        console.log(`[Admin Review] Approving and deploying course ${course.slug}...`);
        
        let totalLessons = 0;
        course.modules.forEach(mod => { totalLessons += mod._count.lessons; });

        try {
            const program = getServerProgram();
            const backendWallet = getBackendWallet();
            
            const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
            const [coursePda] = PublicKey.findProgramAddressSync([Buffer.from("course"), Buffer.from(course.slug)], PROGRAM_ID);
            
            const courseExists = await program.account.course.fetchNullable(coursePda);
            const contentTxId = new Array(32).fill(0); // Заглушка
            
            let diffNum = 1;
            if (course.difficulty === "Intermediate") diffNum = 2;
            if (course.difficulty === "Advanced") diffNum = 3;

            if (!courseExists) {
                // Создаем курс в блокчейне
                await program.methods.createCourse({
                    courseId: course.slug,
                    creator: backendWallet.publicKey, // ВАЖНО: Создателем ончейн пока выступает бэкенд
                    contentTxId: contentTxId,
                    lessonCount: totalLessons,
                    difficulty: diffNum,
                    xpPerLesson: new BN(course.xpPerLesson),
                    trackId: 2, // Опционально: можно сделать динамическим
                    trackLevel: 1,
                    prerequisite: null,
                    creatorRewardXp: new BN(0), // Роялти пока отключены
                    minCompletionsForReward: 10,
                })
                .accounts({
                    course: coursePda,
                    config: configPda,
                    authority: backendWallet.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .signers([backendWallet.payer])
                .rpc();
                
                console.log(`[Admin Review] ✅ Course ${course.slug} created on-chain!`);
            } else {
                console.log(`[Admin Review] ⚠️ Course already exists on-chain. Skipping creation.`);
            }

            // Обновляем статус в БД на APPROVED
            await prisma.course.update({
                where: { id: courseId },
                data: { 
                    status: "APPROVED",
                    reviewComment: "Approved and published!"
                }
            });

            return NextResponse.json({ success: true, message: "Course approved and published!" });

        } catch (chainError: any) {
            console.error("[Admin Review] ❌ Blockchain Error:", chainError);
            return NextResponse.json({ error: `Blockchain Deployment Failed: ${chainError.message}` }, { status: 500 });
        }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}