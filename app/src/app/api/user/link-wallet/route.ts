// app/src/app/api/user/link-wallet/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { walletAddress } = await request.json();
    console.log(`[API /link-wallet] Attempting to link ${walletAddress} to session user.`);

    // 1. Проверяем, не занят ли этот кошелек другим юзером
    const existingUserWithWallet = await prisma.user.findUnique({
      where: { walletAddress },
    });

    // @ts-ignore
    const currentUserId = session.user.id;

    if (existingUserWithWallet && existingUserWithWallet.id !== currentUserId) {
      console.warn(`[API /link-wallet] Wallet ${walletAddress} is already linked to user ${existingUserWithWallet.id}`);
      // В идеале здесь нужен Merge, но для хакатона проще запретить и сказать "Кошелек уже используется"
      return NextResponse.json({ error: "This wallet is already linked to another account." }, { status: 400 });
    }

    // 2. Привязываем кошелек к текущему юзеру сессии
    await prisma.user.update({
      where: { id: currentUserId },
      data: { walletAddress },
    });

    console.log(`[API /link-wallet] Successfully linked wallet.`);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("[API /link-wallet] Error:", error);
    return NextResponse.json({ error: "Failed to link wallet" }, { status: 500 });
  }
}