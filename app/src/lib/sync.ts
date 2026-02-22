// app/src/lib/sync.ts
import { connection } from "@/lib/server";
import { prisma } from "@/lib/db";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PROGRAM_ID, XP_MINT } from "@/lib/constants";
import * as anchor from "@coral-xyz/anchor";
import idl from "@/lib/idl/onchain_academy.json";

// Инициализация Read-Only программы для чека состояния
const getReadOnlyProgram = () => {
  const provider = new anchor.AnchorProvider(connection, { publicKey: PublicKey.default } as any, {});
  return new anchor.Program(idl as any, provider);
};

export async function syncBlockchainData(userId: string, walletAddress: string) {
  if (!walletAddress) return;

  console.log(`[Sync] Starting blockchain sync for ${walletAddress}...`);
  const program = getReadOnlyProgram();
  const walletPubkey = new PublicKey(walletAddress);

  // 1. Синхронизация XP (Token Account -> DB)
  try {
    const learnerXpAta = getAssociatedTokenAddressSync(
        XP_MINT,
        walletPubkey,
        false,
        new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb")
    );
    
    // Проверяем баланс
    const balance = await connection.getTokenAccountBalance(learnerXpAta);
    const realXp = Number(balance.value.amount);

    // Обновляем в БД
    await prisma.user.update({
        where: { id: userId },
        data: { xp: realXp }
    });
    console.log(`[Sync] XP synced: ${realXp}`);
  } catch (e) {
    // Аккаунта нет -> 0 XP, ничего не делаем
  }

  // 2. Синхронизация Курсов (Enrollment PDA -> DB)
  // Это сложнее: нужно знать ID всех курсов. Для хакатона захардкодим список известных курсов.
  // В идеале: fetch all courses from DB -> check each PDA.
  const knownCourseIds = ["anchor-101", "solana-mock-test"]; 

  for (const courseId of knownCourseIds) {
      try {
          const [enrollmentPda] = PublicKey.findProgramAddressSync(
              [Buffer.from("enrollment"), Buffer.from(courseId), walletPubkey.toBuffer()],
              PROGRAM_ID
          );

          // Проверяем, существует ли аккаунт в чейне
          const accountInfo = await connection.getAccountInfo(enrollmentPda);
          
          if (accountInfo) {
              // Если аккаунт есть в чейне, но нет в БД -> создаем
              await prisma.userEnrollment.upsert({
                  where: {
                      userId_courseId: { userId, courseId }
                  },
                  create: { userId, courseId },
                  update: {} 
              });
              console.log(`[Sync] Restored enrollment for ${courseId}`);
          }
      } catch (e) {
          console.error(`[Sync] Error checking course ${courseId}`, e);
      }
  }
}