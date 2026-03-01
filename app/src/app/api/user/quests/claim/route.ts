import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

import { getServerProgram, getBackendWallet } from "@/lib/server";
import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID, XP_MINT } from "@/lib/constants";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";

const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userChallengeId, walletAddress } = body;

    if (!userChallengeId || !walletAddress) {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Если ID виртуальный (нажали хаком в DevTools), игнорируем
    if (userChallengeId.startsWith('virtual_')) {
        return NextResponse.json({ error: "Challenge not completed yet" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { walletAddress } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // 1. Находим UserChallenge
    const userChallenge = await prisma.userChallenge.findUnique({
        where: { id: userChallengeId },
        include: { challenge: true } // Нам нужна награда из оригинального задания
    });

    if (!userChallenge) {
        return NextResponse.json({ error: "Quest progress not found" }, { status: 404 });
    }

    // 2. Проверки (защита от читеров)
    if (!userChallenge.isCompleted) {
        return NextResponse.json({ error: "Quest is not completed yet" }, { status: 400 });
    }
    if (userChallenge.claimedAt) {
        return NextResponse.json({ error: "Reward already claimed" }, { status: 400 });
    }
    if (userChallenge.userId !== user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 3. Выполняем транзакцию: Помечаем как собранное + Выдаем XP + Пишем в историю
    const xpReward = userChallenge.challenge.xpReward;

    // НОВОЕ: 3. МИНТИМ XP В БЛОКЧЕЙНЕ (Reward XP Instruction)
    const program = getServerProgram();
    const backendWallet = getBackendWallet();
    const learnerPubkey = new PublicKey(walletAddress);
    
    // Minter Role (Backend Signer был зарегистрирован как минтер при инициализации)
    const [minterRolePda] = PublicKey.findProgramAddressSync([Buffer.from("minter"), backendWallet.publicKey.toBuffer()], PROGRAM_ID);
    const learnerXpAta = getAssociatedTokenAddressSync(XP_MINT, learnerPubkey, false, TOKEN_2022_PROGRAM_ID);
    const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);

    try {
        await program.methods.rewardXp(
            new BN(xpReward), 
            `Claimed Quest: ${userChallenge.challenge.title}`
        )
        .accountsPartial({
            config: configPda,
            minterRole: minterRolePda,
            xpMint: XP_MINT,
            recipientTokenAccount: learnerXpAta,
            minter: backendWallet.publicKey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([backendWallet.payer])
        .rpc();
        
        console.log(`[Quest] Successfully minted ${xpReward} XP on-chain for quest claim.`);
    } catch (chainError) {
        console.error("[Quest] Failed to mint XP on-chain:", chainError);
        // Если блокчейн упал, мы НЕ даем заклеймить в БД, чтобы не было рассинхрона
        return NextResponse.json({ error: "Blockchain transaction failed" }, { status: 500 });
    }

    // 4. Выполняем транзакцию в БД: Помечаем как собранное + Выдаем XP + Пишем в историю
    await prisma.$transaction(async (tx) => {
        await tx.userChallenge.update({
            where: { id: userChallengeId },
            data: { claimedAt: new Date() }
        });

        await tx.user.update({
            where: { id: user.id },
            data: { xp: { increment: xpReward } }
        });

        await tx.xPHistory.create({
            data: {
                userId: user.id,
                amount: xpReward,
                source: "bonus", 
                description: `Claimed Daily Quest: ${userChallenge.challenge.title}`
            }
        });
    });

    return NextResponse.json({ success: true, reward: xpReward });

  } catch (error: any) {
    console.error("Claim error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}