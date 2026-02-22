import { NextResponse } from "next/server";
import { getServerProgram, getBackendWallet, connection } from "@/lib/server";
import { PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { PROGRAM_ID, XP_MINT } from "@/lib/constants";
import { getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction, getAccount, TokenAccountNotFoundError, TokenInvalidAccountOwnerError } from "@solana/spl-token";
import { prisma, updateStreak } from "@/lib/db";

// Точная награда по ТЗ
const XP_REWARD = 50; 
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { courseId, codeAnswer, walletAddress, lessonIndex } = body;

    // 1. Валидация входных данных
    if (!codeAnswer || codeAnswer.length < 5) {
      return NextResponse.json({ error: "Answer too short" }, { status: 400 });
    }

    // 2. [ANTI-FARMING CHECK] Проверяем БД перед блокчейном
    // Находим юзера
    const user = await prisma.user.findUnique({ 
        where: { walletAddress },
        include: { progress: true } // Подгружаем прогресс
    });

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
        const shouldAwardXp = true; // Упрощаем: если мы дошли сюда, значит в БД урока не было

        if (shouldAwardXp) {
            await tx.user.update({
                where: { walletAddress },
                data: { xp: { increment: XP_REWARD } }
            });
        }
    });

    // 5. Обновляем Стрик (вынесено в отдельную логику)
    await updateStreak(walletAddress);

    return NextResponse.json({ success: true, txSignature });

  } catch (error: any) {
    console.error("API verify-lesson error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}