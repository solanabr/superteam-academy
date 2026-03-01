import { NextResponse } from "next/server";
import { getServerProgram, getBackendWallet, connection } from "@/lib/server";
import { PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { PROGRAM_ID, XP_MINT } from "@/lib/constants";
import { getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction, getAccount, TokenAccountNotFoundError, TokenInvalidAccountOwnerError } from "@solana/spl-token";
import { prisma, updateStreak } from "@/lib/db";
import { BN } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { SystemProgram } from "@solana/web3.js";
import { ACHIEVEMENTS_COLLECTION } from "@/lib/constants";
import { checkAndAwardAchievement } from "@/lib/achievements";
import { validateCode } from "@/lib/code-validator";

// Точная награда по ТЗ 
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
const TRACK_COLLECTION = new PublicKey("29yDngMCMH3y3AP26iGkgjsU8uU19H2FFkuTrXM33eSS");
const MPL_CORE_ID = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { courseId, codeAnswer, walletAddress, lessonIndex } = body;

    // 1. Валидация входных данных
    if (!codeAnswer || codeAnswer.length < 5) {
      return NextResponse.json({ error: "Answer too short" }, { status: 400 });
    }

    const courseDb = await prisma.course.findUnique({ 
        where: { slug: courseId },
        include: { modules: { include: { lessons: true } } }
    });

    const allLessons = courseDb?.modules.flatMap(m => m.lessons).sort((a, b) => a.order - b.order) || [];
    const currentLesson = allLessons[lessonIndex];

    // 2. ИНТЕЛЛЕКТУАЛЬНАЯ ВАЛИДАЦИЯ (Anti-Cheat)
    if (currentLesson && currentLesson.validationRules) {
        const rules = currentLesson.validationRules as any[]; // Приводим JSON к массиву правил
        const validation = validateCode(codeAnswer, rules);
            
        if (!validation.isValid) {
            return NextResponse.json({ 
                error: "Validation Failed", 
                details: validation.error 
            }, { status: 400 });
        }
    }

    // 2. [ANTI-FARMING CHECK] Проверяем БД перед блокчейном
    // Находим юзера
    const user = await prisma.user.findUnique({ 
        where: { walletAddress },
        include: { progress: true } // Подгружаем прогресс
    });

    
    const xpRewardAmount = courseDb?.xpPerLesson || 25; // Fallback на 100, если вдруг нет в БД

    if (!user) {
        return NextResponse.json({ error: "User not found. Please sync wallet first." }, { status: 404 });
    }

    // Проверяем, сдан ли этот урок
    const existingProgress = await prisma.lessonProgress.findUnique({
        where: {
            userId_courseId_lessonIndex: {
                userId: user.id,
                courseId: courseId,
                lessonIndex: lessonIndex
            }
        }
    });

    // Если урок уже сдан (completed) — возвращаем успех и НЕ начисляем XP
    if (existingProgress?.status === "completed") {
        return NextResponse.json({ 
            success: true, 
            message: "Lesson already completed (cached)", 
            txSignature: "cached-success" 
        });
    }

    // 3. Блокчейн операции
    const program = getServerProgram();
    const backendWallet = getBackendWallet();
    const learnerPubkey = new PublicKey(walletAddress);
    const learnerXpAta = getAssociatedTokenAddressSync(XP_MINT, learnerPubkey, false, TOKEN_2022_PROGRAM_ID);
    const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
    const [coursePda] = PublicKey.findProgramAddressSync([Buffer.from("course"), Buffer.from(courseId)], PROGRAM_ID);
    const [enrollmentPda] = PublicKey.findProgramAddressSync([Buffer.from("enrollment"), Buffer.from(courseId), learnerPubkey.toBuffer()], PROGRAM_ID);

    // 3.1 Проверка/Создание ATA (если нет)
    try {
      await getAccount(connection, learnerXpAta, "confirmed", TOKEN_2022_PROGRAM_ID);
    } catch (error: any) {
      if (error instanceof TokenAccountNotFoundError || error.name === "TokenAccountNotFoundError") {
        const createAtaTx = new Transaction().add(
          createAssociatedTokenAccountInstruction(backendWallet.publicKey, learnerXpAta, learnerPubkey, XP_MINT, TOKEN_2022_PROGRAM_ID)
        );
        await sendAndConfirmTransaction(connection, createAtaTx, [backendWallet.payer]);
      } else {
        throw error;
      }
    }

    // 3.2 Вызов completeLesson
    let txSignature = "";
    try {
        const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
        const [coursePda] = PublicKey.findProgramAddressSync([Buffer.from("course"), Buffer.from(courseId)], PROGRAM_ID);
        const [enrollmentPda] = PublicKey.findProgramAddressSync([Buffer.from("enrollment"), Buffer.from(courseId), learnerPubkey.toBuffer()], PROGRAM_ID);

        txSignature = await program.methods
        .completeLesson(lessonIndex)
        .accountsPartial({
            config: configPda,
            course: coursePda,
            enrollment: enrollmentPda,
            learner: learnerPubkey,
            learnerTokenAccount: learnerXpAta,
            xpMint: XP_MINT,
            backendSigner: backendWallet.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
        } as any)
        .signers([backendWallet.payer])
        .rpc();
        
    } catch (error: any) {
        // Если блокчейн говорит "Уже пройдено", мы все равно должны обновить БД, 
        // если вдруг рассинхрон.
        if (error.message?.includes("LessonAlreadyCompleted") || error.error?.errorCode?.code === "LessonAlreadyCompleted") {
            txSignature = "already-on-chain";
        } else {
            throw error; // Реальная ошибка
        }
    }

    // 4. [ATOMIC DB UPDATE] Обновляем все состояния в БД
    // Используем транзакцию Prisma для целостности
    await prisma.$transaction(async (tx) => {
        // А. Отмечаем урок как пройденный
        await tx.lessonProgress.upsert({
            where: {
                userId_courseId_lessonIndex: {
                    userId: user.id,
                    courseId: courseId,
                    lessonIndex: lessonIndex
                }
            },
            update: { status: "completed", completedAt: new Date(), codeSnippet: codeAnswer },
            create: {
                userId: user.id,
                courseId: courseId,
                lessonIndex: lessonIndex,
                status: "completed",
                completedAt: new Date(),
                codeSnippet: codeAnswer
            }
        });

        // Б. Убеждаемся, что запись на курс (Enrollment) существует в БД
        // Это нужно для динамического Dashboard
        await tx.userEnrollment.upsert({
            where: {
                userId_courseId: { userId: user.id, courseId: courseId }
            },
            update: {}, // Если есть - ничего не делаем
            create: {
                userId: user.id,
                courseId: courseId
            }
        });

        // В. Начисляем XP (только если транзакция была реальной, а не "already-on-chain")
        // Хотя для синхронизации, если в БД не было completed, а в чейне было - лучше начислить, 
        // чтобы выровнять баланс.
        const shouldAwardXp = true; 
        if (shouldAwardXp) {
            await tx.user.update({
                where: { walletAddress },
                // ИСПОЛЬЗУЕМ ДИНАМИЧЕСКОЕ ЗНАЧЕНИЕ:
                data: { xp: { increment: xpRewardAmount } } 
            });

            await tx.xPHistory.create({
                data: {
                    userId: user.id,
                    amount: xpRewardAmount, // ИСПОЛЬЗУЕМ ДИНАМИЧЕСКОЕ ЗНАЧЕНИЕ
                    source: "lesson",
                    description: `Completed lesson ${lessonIndex + 1} in course ${courseId}`
                }
            });
                // TODO удален. Уведомления уже работают, так как они просто читают XPHistory!
        }

        // НОВОЕ: Трекинг Daily Challenges
        const todayStr = new Date().toISOString().split('T')[0];
                
        // Получаем все активные задания типа LESSON_COUNT
        const activeChallenges = await tx.challenge.findMany({
            where: { type: "LESSON_COUNT", isActive: true }
        });

        for (const challenge of activeChallenges) {
            // Ищем текущий прогресс на сегодня
            const userCh = await tx.userChallenge.findUnique({
                where: {
                    userId_challengeId_dateKey: {
                        userId: user.id,
                        challengeId: challenge.id,
                        dateKey: todayStr
                    }
                }
            });

            const currentCount = (userCh?.currentCount || 0) + 1;
            const isCompleted = currentCount >= challenge.targetCount;

            await tx.userChallenge.upsert({
                where: {
                    userId_challengeId_dateKey: {
                        userId: user.id,
                        challengeId: challenge.id,
                        dateKey: todayStr
                    }
                },
                update: {
                    currentCount: currentCount,
                    isCompleted: isCompleted,
                     // Мы не ставим claimedAt автоматически. Юзер должен сам "забрать" награду.
                },
                create: {
                    userId: user.id,
                    challengeId: challenge.id,
                    dateKey: todayStr,
                    currentCount: currentCount,
                    isCompleted: isCompleted
                }
            });
        }

    });

    // 5. Обновляем Стрик (вынесено в отдельную логику)
    await updateStreak(walletAddress);

    // 6. Проверка на завершение курса
    let certificateMint = null;
    let completedCount = 0;
    let totalLessons = 0;
    
    try {
        // Читаем обновленный аккаунт Enrollment из чейна
        const enrollmentAccount = await program.account.enrollment.fetch(enrollmentPda);
        const lessonFlags = enrollmentAccount.lessonFlags as BN[];
        
        // Читаем аккаунт Course, чтобы узнать lessonCount
        const courseAccount = await program.account.course.fetch(coursePda);
        const totalLessons = courseAccount.lessonCount; // 5
        
        // Считаем пройденные уроки (биты)

        for(let i=0; i < totalLessons; i++) {
             const wordIndex = Math.floor(i / 64);
             const bitIndex = i % 64;
             if (!lessonFlags[wordIndex].and(new BN(1).shln(bitIndex)).isZero()) {
                 completedCount++;
             }
        }

        console.log(`[Verify] Progress: ${completedCount}/${totalLessons}`);

        // ЕСЛИ КУРС ЗАВЕРШЕН (Все уроки пройдены)
        if (completedCount >= totalLessons) {
            console.log("[Verify] Course completed! Finalizing...");

            // А. Finalize Course
            // Проверяем, не финализирован ли уже (completed_at != null)
            if (enrollmentAccount.completedAt === null) {
                const creatorXpAta = getAssociatedTokenAddressSync(XP_MINT, courseAccount.creator, false, TOKEN_2022_PROGRAM_ID);
                
                await program.methods.finalizeCourse()
                    .accountsPartial({
                        config: configPda,
                        course: coursePda,
                        enrollment: enrollmentPda,
                        learner: learnerPubkey,
                        learnerTokenAccount: learnerXpAta,
                        creatorTokenAccount: creatorXpAta,
                        creator: courseAccount.creator,
                        xpMint: XP_MINT,
                        backendSigner: backendWallet.publicKey,
                        tokenProgram: TOKEN_2022_PROGRAM_ID,
                    }as any)
                    .signers([backendWallet.payer])
                    .rpc();
                console.log("[Verify] Course finalized.");
            }

            // Б. Issue Credential
            // Проверяем, есть ли уже сертификат
            if (enrollmentAccount.credentialAsset === null) {
                console.log("[Verify] Issuing credential...");
                console.log(`[Verify] Program ID used: ${PROGRAM_ID.toString()}`);
                console.log(`[Verify] Track Collection: ${TRACK_COLLECTION.toString()}`);
                console.log(`[Verify] Config PDA (Signer): ${configPda.toString()}`);
                const credentialAsset = Keypair.generate(); // Новый адрес для NFT

                console.log(`[Verify] New Asset Keypair: ${credentialAsset.publicKey.toString()}`);

                const totalLessonXp = totalLessons * courseAccount.xpPerLesson;
                const bonusXp = Math.floor(totalLessonXp / 2);
                const totalXpInCourse = totalLessonXp + bonusXp
                
                try {
                    await program.methods.issueCredential(
                        `${courseId.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())} Certificate`, // "Solana Mock Test Certificate"
                        "https://arweave.net/Yx0n2TqR0GqNeJnoYx4SMCjZt0r9uS-KRwQoK_vG2Wc", // Красивая картинка
                        1, // coursesCompleted
                        new BN(totalXpInCourse)
                    )
                    .accountsPartial({
                        config: configPda,
                        course: coursePda,
                        enrollment: enrollmentPda,
                        learner: learnerPubkey,
                        credentialAsset: credentialAsset.publicKey,
                        trackCollection: TRACK_COLLECTION,
                        payer: backendWallet.publicKey,
                        backendSigner: backendWallet.publicKey,
                        mplCoreProgram: MPL_CORE_ID,
                        systemProgram: SystemProgram.programId, // Используем импорт, а не хардкод
                    }as any)
                    .signers([backendWallet.payer, credentialAsset])
                    .rpc();
                    
                    certificateMint = credentialAsset.publicKey.toString();
                    console.log("[Verify] ✅ Credential successfully issued:", certificateMint);
                } catch (issueErr: any) {
                    console.error("[Verify] ❌ FAILED TO ISSUE CREDENTIAL!");
                    console.error("[Verify] Error message:", issueErr.message);
                    if (issueErr.logs) {
                        console.error("[Verify] Transaction Logs:", issueErr.logs);
                    }
                    throw issueErr; // Пробрасываем ошибку дальше, чтобы увидеть в консоли фронтенда
                }
            } else {
                certificateMint = (enrollmentAccount.credentialAsset as PublicKey).toString();
                console.log("[Verify] Credential already exists:", certificateMint);
            }
        }

    } catch (e) {
        console.error("[Verify] Auto-finalize failed:", e);
        // Не фейлим запрос, если не удалось выдать сертификат (юзер всё равно прошел урок)
    }

        // Условие 1: Первый урок ("first-steps")
        // Проверяем, сколько уроков пройдено всего
        const totalCompletedInDb = await prisma.lessonProgress.count({
            where: { userId: user.id, status: "completed" }
        });
        
        // Если это был первый урок (totalCompletedInDb сейчас будет >= 1, т.к. мы только что сохранили)
        if (totalCompletedInDb === 1) {
            // Запускаем асинхронно, не ждем ответа, чтобы не тормозить юзера
            checkAndAwardAchievement(user.id, walletAddress, "first-steps");
        }

        // Условие 2: Завершение курса ("course-champion")
        if (typeof completedCount !== 'undefined' && completedCount >= totalLessons) {
             checkAndAwardAchievement(user.id, walletAddress, "course-champion");
        }

    return NextResponse.json({ success: true, txSignature, certificateMint: certificateMint});

  } catch (error: any) {
    console.error("API verify-lesson error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}