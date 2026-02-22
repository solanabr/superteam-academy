// app/src/lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// 1. Синхронизация пользователя
export async function syncUser(walletAddress: string) {
  return await prisma.user.upsert({
    where: { walletAddress },
    update: { lastLogin: new Date() },
    create: {
      walletAddress,
      streak: 0,
      xp: 0,
      lastLogin: new Date(),
    },
  });
}

// 2. Обновление Стрика
export async function updateStreak(walletAddress: string) {
  const user = await prisma.user.findUnique({ where: { walletAddress } });
  if (!user) return;

  const now = new Date();
  const lastLesson = user.lastLessonAt; 

  let newStreak = user.streak;

  if (!lastLesson) {
      newStreak = 1;
  } else {
      const isSameDay = 
        now.toISOString().split('T')[0] === lastLesson.toISOString().split('T')[0];
      
      const diffTime = Math.abs(now.getTime() - lastLesson.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (isSameDay) {
          // Тот же день
      } else if (diffDays <= 1) {
          newStreak += 1;
      } else {
          newStreak = 1;
      }
  }

  await prisma.user.update({
      where: { walletAddress },
      data: { 
          streak: newStreak,
          lastLessonAt: now 
      }
  });
}

// 3. Сохранение прогресса (Исправлено под новую схему)
export async function saveLessonProgress(
  walletAddress: string, 
  courseId: string,
  lessonIndex: number,
  code: string
) {
  // Сначала находим ID пользователя по кошельку
  const user = await prisma.user.findUnique({ where: { walletAddress } });
  if (!user) throw new Error("User not found");

  return await prisma.lessonProgress.upsert({
    where: {
      // Используем правильное составное имя из новой схемы
      userId_courseId_lessonIndex: {
        userId: user.id,
        courseId: courseId,
        lessonIndex: lessonIndex
      }
    },
    update: {
      codeSnippet: code,
      status: "in_progress",
    },
    create: {
      userId: user.id, // Используем ID юзера
      courseId: courseId,
      lessonIndex: lessonIndex,
      codeSnippet: code,
      status: "in_progress",
    },
  });
}

export async function getLessonProgress(
  walletAddress: string,
  courseId: string,
  lessonIndex: number
) {
  const user = await prisma.user.findUnique({ where: { walletAddress } });
  if (!user) return null;

  return await prisma.lessonProgress.findUnique({
    where: {
      userId_courseId_lessonIndex: {
        userId: user.id,
        courseId: courseId,
        lessonIndex: lessonIndex
      }
    }
  });
}