import { NextRequest, NextResponse } from "next/server";
import { Connection, Keypair, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, createAssociatedTokenAccountIdempotentInstruction, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
// @ts-ignore
import onchainAcademyIdl from "@/lib/idl/onchain_academy.json";
import bs58 from "bs58";
import { client } from "@/sanity/lib/client";
import { courseByIdQuery, CourseDetail } from "@/sanity/lib/queries";
import { withFallbackRPC } from "@/lib/solana-connection";

// Environment Variables
const RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
const BACKEND_WALLET_KEY = process.env.BACKEND_WALLET_PRIVATE_KEY;
const COLLECTION_ADDRESS = process.env.NEXT_PUBLIC_COLLECTION_ADDRESS;

const MPL_CORE_PROGRAM_ID = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

export async function POST(req: NextRequest) {
    try {
        const { courseId, lessonIndex, wallet } = await req.json();

        if (!BACKEND_WALLET_KEY) {
            return NextResponse.json({ error: "Backend wallet not configured" }, { status: 500 });
        }

        const { signature, willGraduate, onchainCourse } = await withFallbackRPC(async (connection) => {
            const backendWallet = Keypair.fromSecretKey(bs58.decode(BACKEND_WALLET_KEY!));
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
                throw new Error("No on-chain enrollment found. Students must enroll themselves (user-paid) before completing lessons.");
            }

            // Fetch Config & Course to get XP Mint and verify Graduation
            const config = await (program.account as any).config.fetch(configPda);
            const onchainCourseInner = await (program.account as any).course.fetch(coursePda);

            const learnerTokenAccount = getAssociatedTokenAddressSync(
                config.xpMint,
                learner,
                true,
                TOKEN_2022_PROGRAM_ID
            );

            const learnerTokenAccountInfo = await connection.getAccountInfo(learnerTokenAccount);

            if (!learnerTokenAccountInfo) {
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

            // Complete current lesson instruction
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
            if (instructions.length > 2) {
                const { ComputeBudgetProgram } = require('@solana/web3.js');
                tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 500000 }));
            }

            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            const signers = [backendWallet];
            tx.sign(...signers);

            const signatureInner = await connection.sendRawTransaction(tx.serialize());
            await connection.confirmTransaction(signatureInner);

            // Check if this completion leads to graduation (to trigger frontend refresh/button)
            let completedLessonsCount = 0;
            const enrollmentState = await (program.account as any).enrollment.fetch(enrollmentPda);
            const lessonFlags = Buffer.from(enrollmentState.lessonFlags);
            for (const byte of lessonFlags) {
                let currentByte = byte;
                while (currentByte > 0) {
                    completedLessonsCount += currentByte & 1;
                    currentByte >>= 1;
                }
            }
            const totalLessons = onchainCourseInner.lessonCount;
            const willGraduateInner = completedLessonsCount === totalLessons;

            return {
                signature: signatureInner,
                willGraduate: willGraduateInner,
                onchainCourse: onchainCourseInner
            };
        });

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

                if (willGraduate) {
                    console.log(`Course ${courseId} is ready for graduation for user ${user.id}`);
                }
            }
        } catch (dbErr) {
            console.error("Failed to sync off-chain completion:", dbErr);
        }

        return NextResponse.json({ success: true, signature: signature });

    } catch (error: any) {
        console.error("Complete Lesson Error:", error);
        return NextResponse.json({ error: error.message || "Failed to complete lesson" }, { status: 500 });
    }
}
