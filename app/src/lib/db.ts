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
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  let newStreak = user.streak;

  if (!user.lastLessonAt) {
      // Самый первый раз
      newStreak = 1;
  } else {
      const lastLessonDay = new Date(user.lastLessonAt.getFullYear(), user.lastLessonAt.getMonth(), user.lastLessonAt.getDate());
      const diffTime = today.getTime() - lastLessonDay.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
          // Вчера был урок, сегодня новый -> увеличиваем
          newStreak += 1;
      } else if (diffDays > 1) {
          // Пропустил вчера. Стрик должен был быть сброшен в /user/me, но на всякий случай:
          // Так как урок пройден СЕГОДНЯ, стрик становится 1.
          newStreak = 1;
      } else if (diffDays === 0) {
          // Сегодня уже был урок.
          // Если стрик 0 (например, после сброса), ставим 1.
          if (newStreak === 0) newStreak = 1;
          // Иначе стрик не меняем (уже начислили сегодня).
      }
  }

  await prisma.user.update({
      where: { walletAddress },
      data: { 
          streak: newStreak,
          lastLessonAt: now // Запоминаем, что урок пройден сейчас
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

// Эта функция будет вызываться при каждом логине / синхронизации пользователя
export async function checkAndResetStreak(walletAddress: string) {
    const user = await prisma.user.findUnique({ where: { walletAddress } });
    if (!user || !user.lastLessonAt) return user;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastLessonDay = new Date(user.lastLessonAt.getFullYear(), user.lastLessonAt.getMonth(), user.lastLessonAt.getDate());
    
    const diffTime = today.getTime() - lastLessonDay.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    // Если прошло БОЛЬШЕ 1 дня (то есть вчера он ничего не делал), стрик СГОРАЕТ на 0.
    if (diffDays > 1 && user.streak > 0) {
        return await prisma.user.update({
            where: { walletAddress },
            data: { streak: 0 } // Обнуляем!
        });
    }

    return user;
}