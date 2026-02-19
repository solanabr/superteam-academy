// app/src/lib/db.ts
import { PrismaClient } from "@prisma/client";

// Singleton паттерн для PrismaClient (чтобы не плодить подключения в dev режиме)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// 1. Синхронизация пользователя (Get or Create)
export async function syncUser(walletAddress: string) {
  const address = walletAddress; // В MongoDB храним как есть

  let user = await prisma.user.findUnique({
    where: { walletAddress: address },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        walletAddress: address,
        streak: 0,
        lastLogin: new Date(),
      },
    });
  } else {
    // Обновляем lastLogin
    await prisma.user.update({
      where: { walletAddress: address },
      data: { lastLogin: new Date() },
    });
  }

  return user;
}

// 2. Обновление Стрика (Вызывается при успешном завершении урока)
export async function updateStreak(walletAddress: string) {
  const user = await prisma.user.findUnique({
    where: { walletAddress },
  });

  if (!user) return null;

  const now = new Date();
  const lastLesson = user.lastLogin; // Используем lastLogin как lastActivity для простоты
  
  // Простая логика дат (без учета часовых поясов для хакатона сойдет)
  const diffTime = Math.abs(now.getTime() - lastLesson.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  let newStreak = user.streak;

  if (diffDays === 1) {
    // Зашел на следующий день - увеличиваем стрик
    newStreak += 1;
  } else if (diffDays > 1) {
    // Пропустил день - сброс
    newStreak = 1;
  }
  // Если diffDays === 0 (тот же день), стрик не меняем

  return await prisma.user.update({
    where: { walletAddress },
    data: { 
      streak: newStreak,
      lastLogin: now 
    },
  });
}

// 3. Сохранение прогресса урока (Draft Code)
// Обновленная функция saveLessonProgress в app/src/lib/db.ts
export async function saveLessonProgress(
  walletAddress: string, 
  courseId: string,
  lessonIndex: number,
  code: string
) {
  return await prisma.lessonProgress.upsert({
    where: {
      userWallet_courseId_lessonIndex: {
        userWallet: walletAddress,
        courseId: courseId,
        lessonIndex: lessonIndex
      }
    },
    update: {
      codeSnippet: code,
      status: "in_progress",
    },
    create: {
      userWallet: walletAddress,
      courseId: courseId,
      lessonIndex: lessonIndex,
      codeSnippet: code,
      status: "in_progress",
    },
  });
}

// Добавим функцию получения прогресса
export async function getLessonProgress(
  walletAddress: string,
  courseId: string,
  lessonIndex: number
) {
  return await prisma.lessonProgress.findUnique({
    where: {
      userWallet_courseId_lessonIndex: {
        userWallet: walletAddress,
        courseId: courseId,
        lessonIndex: lessonIndex
      }
    }
  });
}