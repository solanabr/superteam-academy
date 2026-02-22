
import { NextRequest, NextResponse } from "next/server";
import { Connection, Keypair, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, createAssociatedTokenAccountIdempotentInstruction, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
// @ts-ignore
import onchainAcademyIdl from "@/lib/idl/onchain_academy.json";
import bs58 from "bs58";

// Environment Variables
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
const BACKEND_WALLET_KEY = process.env.BACKEND_WALLET_PRIVATE_KEY;

export async function POST(req: NextRequest) {
    try {
        const { courseId, lessonIndex, wallet } = await req.json();

        if (!BACKEND_WALLET_KEY) {
            return NextResponse.json({ error: "Backend wallet not configured" }, { status: 500 });
        }

        const connection = new Connection(RPC_URL, "confirmed");
        const backendWallet = Keypair.fromSecretKey(bs58.decode(BACKEND_WALLET_KEY));

        const provider = new AnchorProvider(
            connection,
            // @ts-ignore
            { publicKey: backendWallet.publicKey, signTransaction: async (tx) => { tx.sign(backendWallet); return tx; }, signAllTransactions: async (txs) => { txs.forEach(t => t.sign(backendWallet)); return txs; } },
            AnchorProvider.defaultOptions()
        );

        const program = new Program(onchainAcademyIdl as any, provider);

        // PDAs
        const learner = new PublicKey(wallet);
        const [coursePda] = PublicKey.findProgramAddressSync(
            [Buffer.from("course"), Buffer.from(courseId)],
            program.programId
        );
        const [enrollmentPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()],
            program.programId
        );
        const [configPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("config")],
            program.programId
        );

        const enrollmentInfo = await connection.getAccountInfo(enrollmentPda);
        const instructions = [];

        if (!enrollmentInfo) {
            console.log(`Auto-enrolling learner ${wallet} for course ${courseId}`);
            const adminEnrollIx = await program.methods
                .adminEnroll(courseId)
                .accounts({
                    config: configPda,
                    course: coursePda,
                    enrollment: enrollmentPda,
                    learner: learner,
                    authority: backendWallet.publicKey,
                    systemProgram: SystemProgram.programId,
                } as any)
                .instruction();
            instructions.push(adminEnrollIx);
        }

        // Fetch Config to get XP Mint
        const config = await (program.account as any).config.fetch(configPda);

        const learnerTokenAccount = getAssociatedTokenAddressSync(
            config.xpMint,
            learner,
            true, // allow owner off-curve just in case, though learners are usually on curve
            TOKEN_2022_PROGRAM_ID
        );

        const learnerTokenAccountInfo = await connection.getAccountInfo(learnerTokenAccount);

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

        // Build Instruction
        const completeLessonIx = await program.methods
            .completeLesson(lessonIndex)
            .accounts({
                config: configPda,
                course: coursePda,
                enrollment: enrollmentPda,
                learner: learner,
                learnerTokenAccount: learnerTokenAccount,
                xpMint: config.xpMint,
                backendSigner: backendWallet.publicKey,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
            } as any)
            .instruction();

        instructions.push(completeLessonIx);

        const tx = new Transaction().add(...instructions);

        tx.feePayer = backendWallet.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        tx.sign(backendWallet);

        const sig = await connection.sendRawTransaction(tx.serialize());
        await connection.confirmTransaction(sig);

        // Sync to Off-Chain DB so Achievements and UI load properly
        try {
            const { prisma } = await import("@/lib/db");
            const user = await prisma.user.findUnique({ where: { walletAddress: wallet }, select: { id: true } });
            if (user) {
                const { createLearningProgressService } = await import("@/lib/learning-progress/prisma-impl");
                const prismaService = createLearningProgressService(prisma);
                await prismaService.completeLesson({
                    userId: user.id,
                    courseId,
                    lessonIndex,
                    xpReward: 100
                });
            }
        } catch (dbErr) {
            console.error("Failed to sync off-chain completion:", dbErr);
        }

        return NextResponse.json({ success: true, signature: sig });

    } catch (error: any) {
        console.error("Complete Lesson Error:", error);
        return NextResponse.json({ error: error.message || "Failed to complete lesson" }, { status: 500 });
    }
}
