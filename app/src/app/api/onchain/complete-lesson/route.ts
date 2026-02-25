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

        const { signature, willGraduate } = await withFallbackRPC(async (connection) => {
            const backendWallet = Keypair.fromSecretKey(bs58.decode(BACKEND_WALLET_KEY!));
            const provider = new AnchorProvider(
                connection,
                // @ts-ignore
                { publicKey: backendWallet.publicKey, signTransaction: async (tx) => { tx.sign(backendWallet); return tx; }, signAllTransactions: async (txs) => { txs.forEach(t => t.sign(backendWallet)); return txs; } },
                AnchorProvider.defaultOptions()
            );

            const program = new Program(onchainAcademyIdl as any, provider);

            // PDAs (synchronous derivation — no RPC needed)
            const learner = new PublicKey(wallet);
            const [coursePda] = PublicKey.findProgramAddressSync([Buffer.from("course"), Buffer.from(courseId)], program.programId);
            const [enrollmentPda] = PublicKey.findProgramAddressSync([Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()], program.programId);
            const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId);

            // ── Batch 1: Parallel RPC reads (3 independent calls → 1 round-trip) ──
            const [enrollmentInfo, config, onchainCourseInner] = await Promise.all([
                connection.getAccountInfo(enrollmentPda),
                (program.account as any).config.fetch(configPda),
                (program.account as any).course.fetch(coursePda),
            ]);

            if (!enrollmentInfo) throw new Error("No on-chain enrollment found.");

            const learnerTokenAccount = getAssociatedTokenAddressSync(config.xpMint, learner, true, TOKEN_2022_PROGRAM_ID);

            // ── Batch 2: ATA check + blockhash in parallel ──
            const [learnerTokenAccountInfo, { blockhash }] = await Promise.all([
                connection.getAccountInfo(learnerTokenAccount),
                connection.getLatestBlockhash(),
            ]);

            const instructions = [];
            if (!learnerTokenAccountInfo) {
                instructions.push(createAssociatedTokenAccountIdempotentInstruction(backendWallet.publicKey, learnerTokenAccount, learner, config.xpMint, TOKEN_2022_PROGRAM_ID));
            }

            const completeLessonIx = await program.methods.completeLesson(lessonIndex).accounts({
                config: configPda,
                course: coursePda,
                enrollment: enrollmentPda,
                learner: learner,
                learnerTokenAccount: learnerTokenAccount,
                xpMint: config.xpMint,
                backendSigner: backendWallet.publicKey,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
            } as any).instruction();

            instructions.push(completeLessonIx);

            const tx = new Transaction().add(...instructions);
            tx.feePayer = backendWallet.publicKey;
            tx.recentBlockhash = blockhash;
            tx.sign(backendWallet);

            // Send without awaiting confirmation
            const signatureInner = await connection.sendRawTransaction(tx.serialize());

            // ── Batch 3: Graduation check + Inngest dispatch in parallel ──
            const { countSetBits } = await import("@/lib/bitmap");
            const [enrollmentState] = await Promise.all([
                (program.account as any).enrollment.fetch(enrollmentPda),
            ]);
            const completedCount = countSetBits(enrollmentState.lessonFlags) + 1; // +1 for the one we just sent
            const willGraduateInner = completedCount >= onchainCourseInner.lessonCount;

            return { signature: signatureInner, willGraduate: willGraduateInner };
        });

        // Fire-and-forget: Inngest handles DB sync, cache invalidation, and tx confirmation
        import("@/lib/inngest/client").then(({ inngest }) => {
            inngest.send({
                name: "solana/lesson.completed",
                data: {
                    signature,
                    wallet,
                    courseId,
                    lessonIndex,
                    xpReward: 100
                }
            }).catch(e => console.error("[complete-lesson] Inngest dispatch failed:", e));
        });

        return NextResponse.json({ success: true, signature, willGraduate });

    } catch (error: any) {
        console.error("Complete Lesson Error:", error);
        return NextResponse.json({ error: error.message || "Failed to complete lesson" }, { status: 500 });
    }
}
