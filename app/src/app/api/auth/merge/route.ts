// app/src/app/api/auth/merge/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { walletAddress } = await request.json();

    if (!session || !session.user || !walletAddress) {
      return NextResponse.json({ error: "Missing session or wallet" }, { status: 400 });
    }

    // 1. Находим пользователя по Кошельку (Основной аккаунт, если начал с кошелька)
    const walletUser = await prisma.user.findUnique({
      where: { walletAddress },
      include: { accounts: true }
    });

    // 2. Находим пользователя по Сессии (Только что созданный NextAuth аккаунт)
    // @ts-ignore
    const sessionUserId = session.user.id;
    const sessionUser = await prisma.user.findUnique({
      where: { id: sessionUserId },
      include: { accounts: true }
    });

    if (!walletUser || !sessionUser) {
      return NextResponse.json({ error: "Users not found" }, { status: 404 });
    }

    if (walletUser.id === sessionUser.id) {
      return NextResponse.json({ message: "Already merged" });
    }

    // ЛОГИКА СЛИЯНИЯ:
    // Мы переносим OAuth аккаунты (GitHub/Google) от sessionUser к walletUser.
    // WalletUser остается основным.

    // 3. Переносим связанные аккаунты (GitHub/Google)
    for (const account of sessionUser.accounts) {
      await prisma.account.update({
        where: { id: account.id },
        data: { userId: walletUser.id }
      });
    }

    // 4. Обновляем данные walletUser (если там пусто, берем из соцсети)
    await prisma.user.update({
      where: { id: walletUser.id },
      data: {
        name: walletUser.name || sessionUser.name,
        email: walletUser.email || sessionUser.email,
        image: walletUser.image || sessionUser.image,
        githubHandle: sessionUser.githubHandle || walletUser.githubHandle,
        // Если username еще нет у walletUser, берем из GitHub
        username: walletUser.username || sessionUser.username,
      }
    });

    // 5. Удаляем временного юзера сессии
    await prisma.user.delete({
      where: { id: sessionUser.id }
    });

    return NextResponse.json({ success: true, mergedId: walletUser.id });

  } catch (error) {
    console.error("Merge error:", error);
    return NextResponse.json({ error: "Merge failed" }, { status: 500 });
  }
}