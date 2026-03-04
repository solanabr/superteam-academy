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
        const thisMonthStr = todayStr.substring(0, 7);
                
        const activeChallenges = await tx.challenge.findMany({
            where: { type: "LESSON_COUNT", isActive: true }
        });

        for (const challenge of activeChallenges) {
            // Ищем текущий прогресс на сегодня
            const dateKeyStr = challenge.period === "MONTHLY" ? thisMonthStr : todayStr;
            const userCh = await tx.userChallenge.findUnique({
                where: {
                    userId_challengeId_dateKey: {
                        userId: user.id,
                        challengeId: challenge.id,
                        dateKey: dateKeyStr
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
                        dateKey: dateKeyStr
                    }
                },
                update: { currentCount, isCompleted },
                create: {
                    userId: user.id,
                    challengeId: challenge.id,
                    dateKey: dateKeyStr,
                    currentCount,
                    isCompleted
                }
            });
        }

    });

    // 5. Обновляем Стрик (вынесено в отдельную логику)
    await updateStreak(walletAddress);

    // 6. Проверка на завершение курса
    let certificateMint: string | null = null;
    let completedCount = 0;
    let totalLessons = 0;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    
    try {
        const enrollmentAccount = await program.account.enrollment.fetch(enrollmentPda);
        const courseAccount = await program.account.course.fetch(coursePda);
        const totalLessons = courseAccount.lessonCount;
            
        let completedCount = 0;
        const lessonFlags = enrollmentAccount.lessonFlags as BN[];
        for (let i = 0; i < totalLessons; i++) {
            if (!lessonFlags[Math.floor(i / 64)].and(new BN(1).shln(i % 64)).isZero()) {
                completedCount++;
            }
        }

        if (completedCount >= totalLessons) {
            // А. ФИНАЛИЗАЦИЯ (если еще не финализирован)
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
                }).signers([backendWallet.payer]).rpc();
                console.log("[Verify] Course finalized.");
            }

            // Расчет XP для атрибутов
            const userXp = await prisma.user.findUnique({ where: { walletAddress: walletAddress } });
            const totalXp = userXp?.xp || completedCount * xpRewardAmount;

            // Б. ЭВОЛЮЦИОНИРУЮЩИЙ NFT (Issue or Upgrade)
            if (enrollmentAccount.credentialAsset === null) {
                // СЦЕНАРИЙ 1: ПЕРВЫЙ СЕРТИФИКАТ (Создание)
                console.log("[Verify] Issuing NEW credential...");
                const credentialAsset = Keypair.generate();

                
                const metadataUri = `${siteUrl}/api/metadata/cert/${courseId}?level=1`;
                    
                await program.methods.issueCredential(
                    `${courseDb?.title || courseId} Certificate`, 
                    metadataUri, // <-- ДИНАМИЧЕСКИЙ URI
                    1, 
                    new BN(totalXp)
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
                    systemProgram: SystemProgram.programId,
                })
                .signers([backendWallet.payer, credentialAsset])
                .rpc();
                    
                certificateMint = credentialAsset.publicKey.toString();
                console.log("[Verify] ✅ New Credential issued:", certificateMint);
            } else {
                // СЦЕНАРИЙ 2: АПГРЕЙД СУЩЕСТВУЮЩЕГО СЕРТИФИКАТА
                // @ts-ignore
                const existingAssetPubkey = enrollmentAccount.credentialAsset as PublicKey;
                 certificateMint = existingAssetPubkey.toString();
                    
                console.log(`[Verify] Upgrading EXISTING credential: ${certificateMint}`);
                    
                // Вычисляем новый уровень (количество пройденных курсов в треке)
                // Для простоты хакатона мы берем количество enrollmentов у юзера
                const enrollmentsCount = await prisma.userEnrollment.count({
                    where: { userId: user.id }
                });
                const newLevel = enrollmentsCount > 0 ? enrollmentsCount : 2;

                const upgradeMetadataUri = `${siteUrl}/api/metadata/cert/${courseId}?level=${newLevel}`;

                await program.methods.upgradeCredential(
                    `Superteam Developer - Level ${newLevel}`,
                    upgradeMetadataUri, // <-- ДИНАМИЧЕСКИЙ URI
                    newLevel,
                    new BN(totalXp)
                )
                .accountsPartial({
                    config: configPda,
                    course: coursePda,
                    enrollment: enrollmentPda,
                    learner: learnerPubkey,
                    credentialAsset: existingAssetPubkey,
                    trackCollection: TRACK_COLLECTION,
                    payer: backendWallet.publicKey,
                    backendSigner: backendWallet.publicKey,
                    mplCoreProgram: MPL_CORE_ID,
                    systemProgram: SystemProgram.programId,
                })
                .signers([backendWallet.payer]) // ВАЖНО: Ассет здесь не нужен, только плательщик
                .rpc();

                console.log("[Verify] ✅ Credential upgraded!");
            }
        }
    } catch (e) {
        console.error("Auto-finalize failed:", e);
    }

        const achievementsToCheck = [];
        // Условие 1: Первый урок ("first-steps")
        // Проверяем, сколько уроков пройдено всего
        const totalCompletedInDb = await prisma.lessonProgress.count({
            where: { userId: user.id, status: "completed" }
        });
        
        // Если это был первый урок (totalCompletedInDb сейчас будет >= 1, т.к. мы только что сохранили)
        if (totalCompletedInDb === 1) {
            achievementsToCheck.push("first-steps-v2");
        }

        // Условие 2: Завершение курса ("course-champion")
        if (typeof completedCount !== 'undefined' && completedCount >= totalLessons) {
            achievementsToCheck.push("course-completer-v2"); // Убедись, что слаг совпадает со скриптом!
        }

        //TODO: сделать для всех ачивок.

        if (achievementsToCheck.length > 0) {
            console.log(`[Verify] Checking achievements: ${achievementsToCheck.join(', ')}`);
            await Promise.allSettled(
                achievementsToCheck.map(slug => checkAndAwardAchievement(user.id, walletAddress, slug))
            );
        }

    return NextResponse.json({ success: true, txSignature, certificateMint: certificateMint});

  } catch (error: any) {
    console.error("API verify-lesson error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}