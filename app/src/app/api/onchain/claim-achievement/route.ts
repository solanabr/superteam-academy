import { NextRequest, NextResponse } from "next/server";
import { Connection, Keypair, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, createAssociatedTokenAccountIdempotentInstruction } from "@solana/spl-token";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
// @ts-ignore
import onchainAcademyIdl from "@/lib/idl/onchain_academy.json";
import bs58 from "bs58";
import { prisma } from "@/lib/db";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { withFallbackRPC } from "@/lib/solana-connection";
import { createLearningProgressService } from "@/lib/learning-progress/prisma-impl";

const RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
const BACKEND_WALLET_KEY = process.env.BACKEND_WALLET_PRIVATE_KEY;
const MPL_CORE_PROGRAM_ID = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

export async function POST(req: NextRequest) {
    try {
        const { achievementId, wallet } = await req.json();

        if (!BACKEND_WALLET_KEY) return NextResponse.json({ error: "Backend wallet not configured" }, { status: 500 });

        const user = await prisma.user.findUnique({
            where: { walletAddress: wallet },
            select: { id: true }
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Off-chain hybrid validation and record keeping
        const prismaService = createLearningProgressService(prisma);
        let claimed = false;
        try {
            claimed = await prismaService.claimAchievement(user.id, achievementId);
        } catch (validationError: any) {
            return NextResponse.json({ error: validationError.message }, { status: 400 });
        }

        if (!claimed) {
            return NextResponse.json({ error: "Not eligible or already claimed" }, { status: 400 });
        }

        // --- On-Chain Minting Logic ---
        const sig = await withFallbackRPC(async (connection) => {
            const backendWallet = Keypair.fromSecretKey(bs58.decode(BACKEND_WALLET_KEY));
            const provider = new AnchorProvider(
                connection,
                // @ts-ignore
                { publicKey: backendWallet.publicKey, signTransaction: async (tx) => { tx.sign(backendWallet); return tx; }, signAllTransactions: async (txs) => { txs.forEach(t => t.sign(backendWallet)); return txs; } },
                AnchorProvider.defaultOptions()
            );

            const program = new Program(onchainAcademyIdl as any, provider);
            const learner = new PublicKey(wallet);

            // PDAs
            const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId);
            const [achievementTypePda] = PublicKey.findProgramAddressSync([Buffer.from("achievement"), Buffer.from(achievementId)], program.programId);
            const [receiptPda] = PublicKey.findProgramAddressSync([Buffer.from("achievement_receipt"), Buffer.from(achievementId), learner.toBuffer()], program.programId);
            const [minterPda] = PublicKey.findProgramAddressSync([Buffer.from("minter"), backendWallet.publicKey.toBuffer()], program.programId);

            // Fetch Accounts
            const config = await (program.account as any).config.fetch(configPda);
            const achievementType = await (program.account as any).achievementType.fetch(achievementTypePda);

            const learnerTokenAccount = getAssociatedTokenAddressSync(
                config.xpMint,
                learner,
                true,
                TOKEN_2022_PROGRAM_ID
            );

            const learnerTokenAccountInfo = await connection.getAccountInfo(learnerTokenAccount);
            const instructions = [];

            if (!learnerTokenAccountInfo) {
                console.log(`Creating XP token account for learner ${wallet}`);
                instructions.push(
                    createAssociatedTokenAccountIdempotentInstruction(
                        backendWallet.publicKey, // payer
                        learnerTokenAccount,     // ata
                        learner,                 // owner
                        config.xpMint,           // mint
                        TOKEN_2022_PROGRAM_ID    // programId
                    )
                );
            }

            const credentialAsset = Keypair.generate();

            const awardAchievementIx = await program.methods
                .awardAchievement()
                .accounts({
                    config: configPda,
                    achievementType: achievementTypePda,
                    achievementReceipt: receiptPda,
                    minter: backendWallet.publicKey,
                    minterRole: minterPda,
                    asset: credentialAsset.publicKey,
                    collection: achievementType.collection,
                    recipient: learner,
                    recipientTokenAccount: learnerTokenAccount,
                    xpMint: config.xpMint,
                    payer: backendWallet.publicKey,
                    mplCoreProgram: MPL_CORE_PROGRAM_ID,
                    tokenProgram: TOKEN_2022_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                } as any)
                .instruction();

            instructions.push(awardAchievementIx);

            const tx = new Transaction().add(...instructions);
            tx.feePayer = backendWallet.publicKey;
            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            tx.sign(backendWallet, credentialAsset);

            const signature = await connection.sendRawTransaction(tx.serialize());
            await connection.confirmTransaction(signature);
            return signature;
        });

        // Invalidate Cache for instant progress update
        try {
            const { invalidatePattern } = await import("@/lib/cache");
            await invalidatePattern(`user:${wallet}*`);
        } catch (e) {
            console.error("[claim-achievement] Cache invalidation failed:", e);
        }

        return NextResponse.json({ success: true, claimed: true, signature: sig });

    } catch (error: any) {
        // If it's an on-chain account missing error (e.g., AchievementType not initialized by admin)
        if (error.message?.includes("Account does not exist")) {
            console.warn("Achievement Type not initialized on-chain, but hybrid DB succeeded.", error.message);
            // It succeeded in the DB, so we return success to the UI to avoid breaking the UX, 
            // but the asset isn't minted yet. The admin needs to initialize the account.
            return NextResponse.json({ success: true, claimed: true, warning: "On-Chain badge pending admin initialization." });
        }

        console.error("Claim Achievement Error:", error);
        return NextResponse.json({ error: error.message || "Failed to claim" }, { status: 500 });
    }
}
