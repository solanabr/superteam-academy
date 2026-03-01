import { NextResponse } from "next/server";
import { prisma, checkAndResetStreak } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncBlockchainData } from "@/lib/sync";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const walletParam = searchParams.get("wallet");

    let user = null;

    // 1. Поиск по сессии (приоритет)
    if (session?.user) {
      // @ts-ignore
      const userId = session.user.id;
      // Проверка на валидность MongoDB ObjectId
      if (userId && /^[0-9a-fA-F]{24}$/.test(userId)) {
          user = await prisma.user.findUnique({
            where: { id: userId },
            include: { 
              accounts: true, 
              enrollments: true,
              achievements: { include: { achievement: true } }
            }
          });
      }
    } 
    
    // 2. Если не нашли по сессии, ищем по кошельку
    if (!user && walletParam && walletParam !== "null" && walletParam !== "undefined") {
      user = await prisma.user.findUnique({
        where: { walletAddress: walletParam },
        include: { 
          accounts: true, 
          enrollments: true,
          achievements: { include: { achievement: true } }
        }
      });
    }

    // 3. Создание, если нет (только если передан кошелек)
    if (!user) {
      if (walletParam) {
          user = await prisma.user.create({
              data: { walletAddress: walletParam }
          });
          // После создания возвращаем пустые массивы связей, чтобы фронт не упал
          user = { ...user, accounts: [], enrollments: [], achievements: [] } as any;
      } else {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    // 4. Логика Стриков и Синхронизации
    if (user && user.walletAddress) {
        // [STREAK RESET CHECK] - Сбрасываем, если пропустил день
        // Важно: checkAndResetStreak возвращает обновленного юзера
        const updatedUser = await checkAndResetStreak(user.walletAddress);
        if (updatedUser) {
            // Мержим обновления стрика в объект user, чтобы фронт сразу увидел 0
            user.streak = updatedUser.streak;
            user.lastLessonAt = updatedUser.lastLessonAt;
        }

        // [SYNC] Запускаем синхронизацию в фоне (не ждем)
        syncBlockchainData(user.id, user.walletAddress).catch(e => console.error("Sync failed:", e));
    }

    return NextResponse.json(user);

  } catch (error) {
    console.error("[API /user/me] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}