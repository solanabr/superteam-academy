import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncBlockchainData } from "@/lib/sync";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const walletParam = searchParams.get("wallet");

    let user = null;

    // 1. Поиск по сессии
    if (session?.user) {
      // @ts-ignore
      const userId = session.user.id;
      
      // Проверка на валидность MongoDB ObjectId (24 hex символа)
      // Это предотвратит ошибку Malformed ObjectID
      if (userId && /^[0-9a-fA-F]{24}$/.test(userId)) {
          user = await prisma.user.findUnique({
            where: { id: userId },
            include: { accounts: true, enrollments: true }
          });
      }
    } 
    
    // 2. Если по сессии не нашли, ищем по кошельку
    if (!user && walletParam && walletParam !== "null" && walletParam !== "undefined") {
      user = await prisma.user.findUnique({
        where: { walletAddress: walletParam },
        include: { accounts: true, enrollments: true }
      });
    }

    if (!user) {
      // Если это чистый вход кошельком без записи в БД (редкий кейс, но возможен)
      if (walletParam) {
          // Создаем, чтобы работала синхронизация
          user = await prisma.user.create({
              data: { walletAddress: walletParam }
          });
      } else {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    // Фоновая синхронизация (без await)
    if (user.walletAddress) {
        syncBlockchainData(user.id, user.walletAddress)
            .catch(e => console.error("Sync failed:", e));
    }

    return NextResponse.json(user);

  } catch (error) {
    console.error("[API /user/me] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}