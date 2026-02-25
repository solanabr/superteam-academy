// app/src/lib/achievements.ts
import { prisma } from "@/lib/db";
import { getServerProgram, getBackendWallet } from "@/lib/server";
import { PublicKey, Keypair } from "@solana/web3.js";
import { PROGRAM_ID, XP_MINT } from "@/lib/constants";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

const MPL_CORE_ID = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

export async function checkAndAwardAchievement(
    userId: string, 
    walletAddress: string, 
    slug: string
) {
    // 1. Находим ачивку в БД
    const dbAch = await prisma.achievement.findUnique({ where: { slug } });
    
    if (!dbAch || !dbAch.collectionAddress) {
        console.error(`[Achievement] Type not found or missing collection: ${slug}`);
        return null;
    }

    // 2. Проверяем, есть ли она у юзера
    const existingAch = await prisma.userAchievement.findFirst({
        where: { userId, achievementId: dbAch.id }
    });
    
    if (existingAch) return null;

    console.log(`[Achievement] Unlocking: ${slug} (Collection: ${dbAch.collectionAddress})`);

    const backendWallet = getBackendWallet();
    const program = getServerProgram();
    const learnerPubkey = new PublicKey(walletAddress);
    const collectionPubkey = new PublicKey(dbAch.collectionAddress); // Берем из БД

    // 3. Подготовка PDA
    const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
    const [achTypePda] = PublicKey.findProgramAddressSync([Buffer.from("achievement"), Buffer.from(slug)], PROGRAM_ID);
    const [receiptPda] = PublicKey.findProgramAddressSync([Buffer.from("achievement_receipt"), Buffer.from(slug), learnerPubkey.toBuffer()], PROGRAM_ID);
    
    // ВАЖНО: MinterRole PDA зависит от того, кто подписывает как minter.
    // У нас это backendWallet.
    const [minterRolePda] = PublicKey.findProgramAddressSync([Buffer.from("minter"), backendWallet.publicKey.toBuffer()], PROGRAM_ID);
    
    const learnerXpAta = getAssociatedTokenAddressSync(XP_MINT, learnerPubkey, false, TOKEN_2022_PROGRAM_ID);
    const asset = Keypair.generate();

    // 4. Минт
    try {
        const tx = await program.methods.awardAchievement()
            .accountsPartial({
                config: configPda,
                achievementType: achTypePda,
                achievementReceipt: receiptPda,
                minterRole: minterRolePda,
                asset: asset.publicKey,
                collection: collectionPubkey,
                recipient: learnerPubkey,
                recipientTokenAccount: learnerXpAta,
                xpMint: XP_MINT,
                payer: backendWallet.publicKey,
                minter: backendWallet.publicKey,
                mplCoreProgram: MPL_CORE_ID,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
                systemProgram: PublicKey.default,
            } as any)
            .signers([backendWallet.payer, asset])
            .rpc();

        console.log(`[Achievement] Minted! Tx: ${tx}`);

        // 5. Запись в БД факта получения
        await prisma.userAchievement.create({
            data: {
                userId,
                achievementId: dbAch.id,
                mintAddress: asset.publicKey.toString()
            }
        });
        
        // Начисляем XP в БД
        await prisma.user.update({
            where: { id: userId },
            data: { xp: { increment: dbAch.xpReward } }
        });

        return tx;

    } catch (e) {
        console.error(`[Achievement] Failed to award ${slug}:`, e);
        return null;
    }
}