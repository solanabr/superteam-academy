// app/src/app/api/user/sync/route.ts
import { NextResponse } from "next/server";
import { syncUser, prisma } from "@/lib/db";
import { connection } from "@/lib/server"; // Импортируй connection
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { XP_MINT } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const { walletAddress } = await request.json();
    
    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet required" }, { status: 400 });
    }

    // 1. Синхронизируем базовые поля (Last Login)
    let user = await syncUser(walletAddress);

    // 2. [SYNC FIX] Подтягиваем реальный баланс XP из блокчейна в БД
    // Это гарантирует, что Leaderboard всегда актуален
    try {
        const learnerPubkey = new PublicKey(walletAddress);
        const learnerXpAta = getAssociatedTokenAddressSync(
            XP_MINT,
            learnerPubkey,
            false,
            new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb")
        );

        const balance = await connection.getTokenAccountBalance(learnerXpAta);
        const realXp = Number(balance.value.amount);

        // Если в БД значение отличается - обновляем
        if (user.xp !== realXp) {
            user = await prisma.user.update({
                where: { walletAddress },
                data: { xp: realXp }
            });
        }
    } catch (e) {
        // Если аккаунта токенов нет (0 XP), это ок, игнорируем ошибку
        console.log("No XP account found for sync, skipping XP update");
    }

    return NextResponse.json(user);

  } catch (error) {
    console.error("Sync user error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}