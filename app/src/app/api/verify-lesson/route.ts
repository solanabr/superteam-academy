// app/src/app/api/verify-lesson/route.ts
import { NextResponse } from "next/server";
import { getServerProgram, getBackendWallet } from "@/lib/server";
import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID, XP_MINT } from "@/lib/constants";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { courseId, lessonId, codeAnswer, walletAddress, lessonIndex } = body;

    // 1. Простая Валидация (Anti-Cheat)
    // В реальном проекте тут был бы запуск тестов кода.
    // Для хакатона: проверяем, что код не пустой и содержит, например, ключевое слово.
    if (!codeAnswer || codeAnswer.length < 5) {
      return NextResponse.json({ error: "Answer too short or empty" }, { status: 400 });
    }

    // 2. Подготовка данных для блокчейна
    const program = getServerProgram();
    const backendWallet = getBackendWallet();
    const learnerPubkey = new PublicKey(walletAddress);

    // PDA: Config
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")], PROGRAM_ID
    );

    // PDA: Course
    const [coursePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("course"), Buffer.from(courseId)], PROGRAM_ID
    );

    // PDA: Enrollment
    const [enrollmentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("enrollment"), Buffer.from(courseId), learnerPubkey.toBuffer()],
      PROGRAM_ID
    );

    // XP Accounts (Token-2022)
    const learnerXpAta = getAssociatedTokenAddressSync(
      XP_MINT,
      learnerPubkey,
      false,
      new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb")
    );

    // 3. Формирование и отправка транзакции
    // Бэкенд платит за газ и подписывает транзакцию
    const tx = await program.methods
    .completeLesson(lessonIndex)
    .accountsPartial({
        config: configPda,
        course: coursePda,
        enrollment: enrollmentPda,
        learner: learnerPubkey,
        learnerTokenAccount: learnerXpAta,
        xpMint: XP_MINT,
        backendSigner: backendWallet.publicKey,
        tokenProgram: new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"),
    } as any)
    .signers([backendWallet.payer])
    .rpc();

    console.log(`Lesson ${lessonIndex} completed for ${walletAddress}. Tx: ${tx}`);

    return NextResponse.json({ success: true, txSignature: tx });

  } catch (error: any) {
    console.error("API verify-lesson error:", error);
    
    // Обработка специфичных ошибок Anchor (например, урок уже пройден)
    if (error.message?.includes("LessonAlreadyCompleted")) {
      return NextResponse.json({ error: "You have already completed this lesson!" }, { status: 400 });
    }

    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}