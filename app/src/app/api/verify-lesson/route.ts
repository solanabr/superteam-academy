// app/src/app/api/verify-lesson/route.ts
import { NextResponse } from "next/server";
import { getServerProgram, getBackendWallet, connection } from "@/lib/server";
import { PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { PROGRAM_ID, XP_MINT } from "@/lib/constants";
import { 
  getAssociatedTokenAddressSync, 
  createAssociatedTokenAccountInstruction, 
  getAccount, 
  TokenAccountNotFoundError, 
  TokenInvalidAccountOwnerError 
} from "@solana/spl-token";

// ID программы токенов 2022
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { courseId, lessonId, codeAnswer, walletAddress, lessonIndex } = body;

    // 1. Простая Валидация
    if (!codeAnswer || codeAnswer.length < 5) {
      return NextResponse.json({ error: "Answer too short or empty" }, { status: 400 });
    }

    const program = getServerProgram();
    const backendWallet = getBackendWallet();
    const learnerPubkey = new PublicKey(walletAddress);

    // 2. Получаем адрес ATA (Token Account) для XP
    const learnerXpAta = getAssociatedTokenAddressSync(
      XP_MINT,
      learnerPubkey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    // 3. ПРОВЕРКА И СОЗДАНИЕ ATA (Исправление ошибки 6000)
    try {
      // Пытаемся получить информацию об аккаунте
      await getAccount(connection, learnerXpAta, "confirmed", TOKEN_2022_PROGRAM_ID);
    } catch (error: any) {
      // Если аккаунт не найден или у него неверный владелец -> создаем его
      if (error instanceof TokenAccountNotFoundError || error instanceof TokenInvalidAccountOwnerError || error.name === "TokenAccountNotFoundError") {
        console.log(`Creating XP Token Account for ${walletAddress}...`);
        
        const createAtaTx = new Transaction().add(
          createAssociatedTokenAccountInstruction(
            backendWallet.publicKey, // Payer (платит бэкенд)
            learnerXpAta,            // Ata Address
            learnerPubkey,           // Owner (юзер)
            XP_MINT,                 // Mint
            TOKEN_2022_PROGRAM_ID    // Program ID
          )
        );

        // Отправляем транзакцию создания аккаунта
        await sendAndConfirmTransaction(connection, createAtaTx, [backendWallet.payer]);
        console.log("XP Token Account created successfully.");
      } else {
        throw error; // Какая-то другая ошибка
      }
    }

    // 4. Подготовка PDA для completeLesson
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")], PROGRAM_ID
    );

    const [coursePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("course"), Buffer.from(courseId)], PROGRAM_ID
    );

    const [enrollmentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("enrollment"), Buffer.from(courseId), learnerPubkey.toBuffer()],
      PROGRAM_ID
    );

    // 5. Вызов completeLesson
    console.log(`Completing lesson ${lessonIndex} for ${walletAddress}...`);
    
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

    console.log(`Lesson completed. Tx: ${tx}`);

    // Опционально: Сохраняем прогресс в БД (Prisma)
    // await saveLessonProgress(...) 

    return NextResponse.json({ success: true, txSignature: tx });

  } catch (error: any) {
    console.error("API verify-lesson error:", error);
    
    // Обработка ошибки "Урок уже пройден"
    if (error.message?.includes("LessonAlreadyCompleted") || error.error?.errorCode?.code === "LessonAlreadyCompleted") {
       // Это не совсем ошибка, юзер молодец, просто повторно нажал
       return NextResponse.json({ success: true, message: "Already completed", txSignature: "already-done" });
    }

    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}