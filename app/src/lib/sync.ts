// app/src/lib/sync.ts
import { connection } from "@/lib/server";
import { prisma, updateStreak } from "@/lib/db";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PROGRAM_ID, XP_MINT } from "@/lib/constants";
import * as anchor from "@coral-xyz/anchor";
import idl from "@/lib/idl/onchain_academy.json";
import { OnchainAcademy } from "@/types/onchain_academy";
import { BN } from "@coral-xyz/anchor";

const getReadOnlyProgram = () => {
  const provider = new anchor.AnchorProvider(connection, { publicKey: PublicKey.default } as any, {});
  return new anchor.Program<OnchainAcademy>(idl as any, provider);
};

// Функция проверки бита (есть ли урок в карте)
function isLessonComplete(lessonFlags: BN[] | number[], lessonIndex: number): boolean {
    if (!lessonFlags) return false;
    
    // Anchor возвращает BN[], но иногда это может быть number[] в JSON
    const wordIndex = Math.floor(lessonIndex / 64);
    const bitIndex = lessonIndex % 64;
    
    const word = lessonFlags[wordIndex];
    if (!word) return false;

    // Работаем с BN
    const bnWord = new BN(word);
    return !bnWord.and(new BN(1).shln(bitIndex)).isZero();
}

export async function syncBlockchainData(userId: string, walletAddress: string) {
  if (!walletAddress) return;

  console.log(`[Sync] Starting full sync for ${walletAddress}...`);
  const program = getReadOnlyProgram();
  const walletPubkey = new PublicKey(walletAddress);
  let hasRestoredLessonsThisSession = false;

  // 1. XP Sync (уже было)
  try {
    const learnerXpAta = getAssociatedTokenAddressSync(XP_MINT, walletPubkey, false, new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"));
    const balance = await connection.getTokenAccountBalance(learnerXpAta);
    const realXp = Number(balance.value.amount);
    
    // Получаем текущего юзера, чтобы узнать разницу
    const dbUser = await prisma.user.findUnique({ where: { id: userId }});
    
    if (dbUser && dbUser.xp !== realXp) {
        const diff = realXp - dbUser.xp;
        
        await prisma.user.update({ where: { id: userId }, data: { xp: realXp } });
        
        // Если XP увеличился (например, через скрипт), пишем в историю!
        if (diff > 0) {
            await prisma.xPHistory.create({
                data: {
                    userId: userId,
                    amount: diff,
                    source: "sync",
                    description: "Blockchain state synchronization"
                }
            });
        }
        console.log(`[Sync] XP restored: ${realXp} (Diff: +${diff})`);
    }
  } catch (e) {}

  // 2. Courses & Lessons Sync (НОВАЯ ЛОГИКА)
  // Список всех известных курсов (в проде fetch from DB)
  const knownCourseIds = ["anchor-101", "solana-mock-test"]; 

  for (const courseId of knownCourseIds) {
      try {
          const [enrollmentPda] = PublicKey.findProgramAddressSync(
              [Buffer.from("enrollment"), Buffer.from(courseId), walletPubkey.toBuffer()],
              PROGRAM_ID
          );

          // Читаем аккаунт Enrollment через Anchor (чтобы он распарсил данные)
          // fetchNullable не работает в node.js без провайдера с кошельком иногда, поэтому try/catch
          const enrollmentAccount = await program.account.enrollment.fetch(enrollmentPda);
          
          if (enrollmentAccount) {
              console.log(`[Sync] Found enrollment for ${courseId}`);

              // А. Восстанавливаем запись на курс
              await prisma.userEnrollment.upsert({
                  where: { userId_courseId: { userId, courseId } },
                  create: { userId, courseId },
                  update: {} 
              });

              // Б. Восстанавливаем прогресс уроков
              // Проверяем первые 256 уроков (максимум битмапа)
              // В реальности можно брать lessonCount из курса, но пока так
              const lessonFlags = enrollmentAccount.lessonFlags as BN[];
              
              // Проходимся по предполагаемым урокам (например, до 50)
                for (let i = 0; i < 50; i++) {
                  if (isLessonComplete(lessonFlags, i)) {
                      // СНАЧАЛА проверяем, есть ли урок в БД и завершен ли он
                      const existingProgress = await prisma.lessonProgress.findUnique({
                          where: {
                              userId_courseId_lessonIndex: {
                                  userId,
                                  courseId,
                                  lessonIndex: i
                              }
                          }
                      });

                      // Если урока НЕТ или он НЕ завершен -> тогда мы его "восстанавливаем"
                      if (!existingProgress || existingProgress.status !== "completed") {
                          await prisma.lessonProgress.upsert({
                              where: {
                                  userId_courseId_lessonIndex: {
                                      userId,
                                      courseId,
                                      lessonIndex: i
                                  }
                              },
                              update: { status: "completed", completedAt: new Date() }, 
                              create: {
                                  userId,
                                  courseId,
                                  lessonIndex: i,
                                  status: "completed",
                                  completedAt: new Date(), // Ставим дату восстановления
                                  codeSnippet: "// Restored from blockchain"
                              }
                          });
                          console.log(`[Sync] Restored lesson ${i} for ${courseId}`);
                          hasRestoredLessonsThisSession = true; // ТОЛЬКО ЗДЕСЬ
                      }
                      // Если урок уже completed, мы ничего не делаем и флаг не ставим.
                  }
              }
          }
      } catch (e: any) {
          // Ошибка "Account does not exist" нормальна, если не записан
          if (!e.message?.includes("Account does not exist")) {
             console.error(`[Sync] Error checking course ${courseId}`, e);
          }
      }
  }

  if (hasRestoredLessonsThisSession) {
    console.log(`[Sync] Lessons restored. Updating streak...`);
    await updateStreak(walletAddress);
  }
}