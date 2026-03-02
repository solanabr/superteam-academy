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

  console.log(`[Sync] 🔄 Starting full sync for ${walletAddress}...`);
  const program = getReadOnlyProgram();
  const walletPubkey = new PublicKey(walletAddress);
  let hasRestoredLessonsThisSession = false;

  // 1. XP Sync
  try {
    const learnerXpAta = getAssociatedTokenAddressSync(XP_MINT, walletPubkey, false, new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"));
    const balance = await connection.getTokenAccountBalance(learnerXpAta);
    const realXp = Number(balance.value.amount);
    
    const dbUser = await prisma.user.findUnique({ where: { id: userId }});
    
    if (dbUser && dbUser.xp !== realXp) {
        const diff = realXp - dbUser.xp;
        await prisma.user.update({ where: { id: userId }, data: { xp: realXp } });
        if (diff > 0) {
            await prisma.xPHistory.create({
                data: { userId, amount: diff, source: "sync", description: "Blockchain state synchronization" }
            });
        }
        console.log(`[Sync] 💰 XP restored: ${realXp} (Diff: +${diff})`);
    }
  } catch (e) {}

  // 2. Courses & Lessons Sync (ДИНАМИЧЕСКИЙ СПИСОК)
  // Получаем ВСЕ курсы из базы данных
  const allCourses = await prisma.course.findMany({ select: { slug: true } });
  const courseIds = allCourses.map(c => c.slug);
  
  console.log(`[Sync] 📚 Checking progress for ${courseIds.length} courses:`, courseIds);

  for (const courseId of courseIds) {
      try {
          const [enrollmentPda] = PublicKey.findProgramAddressSync(
              [Buffer.from("enrollment"), Buffer.from(courseId), walletPubkey.toBuffer()],
              PROGRAM_ID
          );

          const enrollmentAccount = await program.account.enrollment.fetchNullable(enrollmentPda);
          
          if (enrollmentAccount) {
              console.log(`[Sync] ✅ Found on-chain enrollment for ${courseId}`);

              // Восстанавливаем запись на курс в БД
              await prisma.userEnrollment.upsert({
                  where: { userId_courseId: { userId, courseId } },
                  create: { userId, courseId },
                  update: {} 
              });

              const lessonFlags = enrollmentAccount.lessonFlags as BN[];
              
              for (let i = 0; i < 50; i++) {
                  if (isLessonComplete(lessonFlags, i)) {
                      const existingProgress = await prisma.lessonProgress.findUnique({
                          where: { userId_courseId_lessonIndex: { userId, courseId, lessonIndex: i } }
                      });

                      if (!existingProgress || existingProgress.status !== "completed") {
                          await prisma.lessonProgress.upsert({
                              where: { userId_courseId_lessonIndex: { userId, courseId, lessonIndex: i } },
                              update: { status: "completed", completedAt: new Date() },
                              create: {
                                  userId, courseId, lessonIndex: i,
                                  status: "completed", completedAt: new Date(),
                                  codeSnippet: "// Restored from blockchain"
                              }
                          });
                          console.log(`[Sync] 📝 Restored lesson ${i} for ${courseId}`);
                          hasRestoredLessonsThisSession = true;
                      }
                  }
              }
          }
      } catch (e: any) {
         console.error(`[Sync] ❌ Error checking course ${courseId}:`, e.message);
      }
  }

  if (hasRestoredLessonsThisSession) {
    console.log(`[Sync] 🔥 Lessons restored. Updating streak...`);
    await updateStreak(walletAddress);
  }
  
  console.log(`[Sync] ✨ Sync completed for ${walletAddress}`);
}