import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || "all"; // 'all', 'month', 'week'
    const walletParam = searchParams.get("wallet"); // Кошелек текущего юзера для подсчета его ранга

    let leaders: any[] = [];
    let currentUserData = null;

    // Определяем дату старта для фильтрации
    let startDate = new Date(0); // По умолчанию - с начала времен
    const now = new Date();
    if (timeframe === "week") {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (timeframe === "month") {
      startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    if (timeframe === "all") {
      // All Time: просто берем из поля user.xp (это быстрее и надежнее)
      leaders = await prisma.user.findMany({
        take: 50,
        orderBy: { xp: 'desc' },
        select: { walletAddress: true, username: true, xp: true, streak: true, image: true, githubHandle: true }
      });

      // Ищем ранг текущего пользователя
      if (walletParam) {
        const currentUser = await prisma.user.findUnique({ where: { walletAddress: walletParam } });
        if (currentUser) {
            // Считаем, сколько людей имеют больше XP (это и есть ранг)
            const higherRankCount = await prisma.user.count({
                where: { xp: { gt: currentUser.xp } }
            });
            currentUserData = {
                ...currentUser,
                rank: higherRankCount + 1
            };
        }
      }
    } else {
      // Weekly / Monthly: Считаем сумму из XPHistory
      // Prisma groupBy для подсчета суммы XP по каждому юзеру за период
      const historyGroup = await prisma.xPHistory.groupBy({
        by: ['userId'],
        _sum: { amount: true },
        where: { createdAt: { gte: startDate } },
        orderBy: { _sum: { amount: 'desc' } },
        take: 50
      });

      // Извлекаем полные данные юзеров на основе сгруппированных ID
      const userIds = historyGroup.map(g => g.userId);
      const users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, walletAddress: true, username: true, streak: true, image: true, githubHandle: true }
      });

      // Маппим данные и сортируем
      leaders = historyGroup.map(group => {
          const u = users.find(u => u.id === group.userId);
          return {
              walletAddress: u?.walletAddress,
              username: u?.username,
              githubHandle: u?.githubHandle,
              image: u?.image,
              streak: u?.streak || 0,
              xp: group._sum.amount || 0
          };
      }).filter(l => l.walletAddress); // Убираем пустых

      // Ищем ранг текущего пользователя за период
      if (walletParam) {
          const currentUser = await prisma.user.findUnique({ where: { walletAddress: walletParam } });
          if (currentUser) {
              // Сколько он заработал за период
              const myHistory = await prisma.xPHistory.aggregate({
                  _sum: { amount: true },
                  where: { userId: currentUser.id, createdAt: { gte: startDate } }
              });
              const myPeriodXp = myHistory._sum.amount || 0;

              // Сколько людей заработало больше за этот период
              // Prisma не позволяет count с groupBy напрямую, поэтому делаем хитрый ход
              const higherUsers = await prisma.xPHistory.groupBy({
                  by: ['userId'],
                  _sum: { amount: true },
                  having: { amount: { _sum: { gt: myPeriodXp } } },
                  where: { createdAt: { gte: startDate } }
              });

              currentUserData = {
                  ...currentUser,
                  xp: myPeriodXp, // Заменяем общий XP на XP за период для отображения
                  rank: higherUsers.length + 1
              };
          }
      }
    }

    return NextResponse.json({ 
        leaderboard: leaders, 
        currentUser: currentUserData 
    });

  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}