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
  const lastLessonDate = user.lastLessonAt;

  // Устанавливаем время на начало дня для корректного сравнения календарных дней
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let newStreak = user.streak;

  if (!lastLessonDate) {
      // Это самый первый урок в жизни
      newStreak = 1;
  } else {
      const lastLessonDay = new Date(lastLessonDate.getFullYear(), lastLessonDate.getMonth(), lastLessonDate.getDate());
      
      const diffTime = today.getTime() - lastLessonDay.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
          // Идеально: прошел урок вчера, сегодня продолжает
          newStreak += 1;
      } else if (diffDays > 1) {
          // Пропустил день или больше -> сброс стрика
          newStreak = 1;
      }
      // Если diffDays === 0 (уже проходил урок сегодня), стрик не меняем
  }

  // Обновляем и стрик, и дату последнего урока
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