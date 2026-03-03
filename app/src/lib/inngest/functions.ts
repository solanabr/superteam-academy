import { inngest } from "./client";
import { Connection } from "@solana/web3.js";
import { prisma } from "@/lib/db";
import { invalidatePattern } from "@/lib/cache";

const RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";

/**
 * Standard confirmation helper to avoid duplication.
 */
async function confirmOnChain(signature: string) {
    const connection = new Connection(RPC_URL, "confirmed");
    // Standardizing to the more robust confirmation model
    const result = await connection.confirmTransaction(signature, "confirmed");
    if (result.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(result.value.err)}`);
    }
    return result;
}

/**
 * Handles background Course Graduation (Finalize + Mint).
 */
export const handleGraduation = inngest.createFunction(
    {
        id: "handle-graduation",
        idempotency: "event.data.wallet + event.data.courseId"
    },
    { event: "solana/graduation.started" },
    async ({ event, step }) => {
        const { wallet, courseId, lessonCount } = event.data;

        // 1. Finalize On-Chain
        await step.run("finalize-on-chain", async () => {
            const { learningProgressService } = await import("@/lib/learning-progress/service");
            try {
                await learningProgressService.finalizeCourse(wallet, courseId, lessonCount);
            } catch (err: any) {
                if (err.message.includes("0x1775") || err.message.includes("CourseAlreadyFinalized")) {
                    return { skipped: true, reason: "already_finalized" };
                }
                throw err;
            }
            return { success: true };
        });

        // 2. Issue Credential (NFT)
        const mintAddress = await step.run("issue-credential", async () => {
            const { learningProgressService } = await import("@/lib/learning-progress/service");
            const { getCourseById } = await import("@/sanity/lib/queries");
            const course = await getCourseById(courseId);

            if (!course || !course.track) {
                return "SKIPPED_NO_TRACK";
            }

            const trackName = course.track.charAt(0).toUpperCase() + course.track.slice(1);
            return await learningProgressService.issueCredential({
                userId: wallet,
                wallet: wallet,
                courseId: courseId,
                courseName: course.title, // ADDED: Pass actual course title
                trackId: course.track,
                trackName: trackName,
                xpEarned: 500
            });
        });

        // 3. Invalidate Cache
        await step.run("invalidate-cache", async () => {
            await invalidatePattern(`user:${wallet}*`);
        });

        return { success: true, mintAddress };
    }
);

/**
 * Handles background Achievement Claim.
 */
export const handleAchievementClaim = inngest.createFunction(
    {
        id: "handle-achievement-claim",
        idempotency: "event.data.wallet + event.data.achievementId"
    },
    { event: "academy/achievement.claimed" },
    async ({ event, step }) => {
        const { wallet, achievementId } = event.data;

        // 1. Process Claim in DB/On-chain
        await step.run("process-claim", async () => {
            const { learningProgressService } = await import("@/lib/learning-progress/service");
            const user = await prisma.user.findUnique({ where: { walletAddress: wallet } });
            if (!user) throw new Error("User not found");

            const identifier = process.env.NEXT_PUBLIC_USE_ONCHAIN === "true" ? wallet : user.id;
            return await learningProgressService.claimAchievement(identifier, achievementId);
        });

        // 2. Safety Buffer to ensure DB commit
        await step.sleep("db-commit-wait", "1s");

        // 3. Invalidate Cache
        await step.run("invalidate-cache", async () => {
            await invalidatePattern(`user:${wallet}*`);
        });

        return { success: true };
    }
);


/**
 * Handles background confirmation for Course Enrollment.
 */
export const confirmEnrollment = inngest.createFunction(
    {
        id: "confirm-enrollment",
        idempotency: "event.data.signature"
    },
    { event: "solana/enrollment.sent" },
    async ({ event, step }) => {
        const { signature, wallet, courseId } = event.data;

        await step.run("confirm-on-chain", async () => {
            return await confirmOnChain(signature);
        });

        await step.run("sync-db-state", async () => {
            const user = await prisma.user.findUnique({ where: { walletAddress: wallet } });
            if (user) {
                const { createLearningProgressService } = await import("@/lib/learning-progress/prisma-impl");
                const service = createLearningProgressService(prisma);
                await service.enroll(user.id, courseId);
            }
        });

        await step.run("invalidate-user-cache", async () => {
            await invalidatePattern(`user:${wallet}*`);
        });

        return { success: true };
    }
);

/**
 * Handles background confirmation for Lesson Completion.
 */
export const confirmLessonCompletion = inngest.createFunction(
    {
        id: "confirm-lesson-completion",
        idempotency: "event.data.signature"
    },
    { event: "solana/lesson.completed" },
    async ({ event, step }) => {
        const { signature, wallet, courseId, lessonIndex, xpReward } = event.data;

        await step.run("confirm-on-chain", async () => {
            return await confirmOnChain(signature);
        });

        await step.run("sync-db-state", async () => {
            const user = await prisma.user.findUnique({ where: { walletAddress: wallet } });
            if (user) {
                const { createLearningProgressService } = await import("@/lib/learning-progress/prisma-impl");
                const service = createLearningProgressService(prisma);
                await service.completeLesson({
                    userId: user.id,
                    courseId,
                    lessonIndex,
                    xpReward
                });
            }
        });

        await step.run("invalidate-user-cache", async () => {
            await invalidatePattern(`user:${wallet}*`);
        });

        return { success: true };
    }
);

/**
 * Handles background Course Creation (On-chain PDA Sync).
 */
export const confirmCourseCreation = inngest.createFunction(
    {
        id: "confirm-course-creation",
        idempotency: "event.data.courseId"
    },
    { event: "solana/course.published" },
    async ({ event, step }) => {
        const { courseId, wallet, lessonCount, difficulty, xpPerLesson, trackId, trackLevel } = event.data;

        await step.run("sync-on-chain", async () => {
            const { syncCourseOnChain } = await import("@/lib/onchain-admin");
            return await syncCourseOnChain({
                courseId,
                wallet,
                lessonCount,
                difficulty,
                xpPerLesson,
                trackId,
                trackLevel
            });
        });

        return { success: true };
    }
);

/**
 * Handles background Unenrollment confirmation.
 */
export const confirmUnenrollment = inngest.createFunction(
    {
        id: "confirm-unenrollment",
        idempotency: "event.data.signature"
    },
    { event: "solana/unenrollment.sent" },
    async ({ event, step }) => {
        const { signature, wallet, courseId } = event.data;

        await step.run("confirm-on-chain", async () => {
            return await confirmOnChain(signature);
        });

        await step.run("invalidate-user-cache", async () => {
            await invalidatePattern(`user:${wallet}*`);
        });

        return { success: true };
    }
);

/**
 * Handles background confirmation for Quiz Completion.
 */
export const handleQuizCompletion = inngest.createFunction(
    {
        id: "handle-quiz-completion",
        idempotency: "event.data.wallet + event.data.quizId"
    },
    { event: "academy/quiz.completed" },
    async ({ event, step }) => {
        const { wallet, courseId, moduleId, quizId, xpReward } = event.data;

        // 1. Mint XP tokens on-chain (same as lesson completion pattern)
        if (process.env.NEXT_PUBLIC_USE_ONCHAIN === "true") {
            await step.run("mint-quiz-xp-onchain", async () => {
                try {
                    const { Connection, Keypair, PublicKey, Transaction } = await import("@solana/web3.js");
                    const { getAssociatedTokenAddressSync } = await import("@solana/spl-token");
                    const { Program, AnchorProvider, BN } = await import("@coral-xyz/anchor");
                    const bs58 = (await import("bs58")).default;
                    const onchainAcademyIdl = (await import("@/lib/idl/onchain_academy.json")).default;

                    const BACKEND_WALLET_KEY = process.env.BACKEND_WALLET_PRIVATE_KEY;
                    if (!BACKEND_WALLET_KEY) {
                        console.warn("[quiz-inngest] No backend wallet key, skipping on-chain mint");
                        return { skipped: true };
                    }

                    const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
                    const connection = new Connection(RPC_URL, "confirmed");
                    const backendWallet = Keypair.fromSecretKey(bs58.decode(BACKEND_WALLET_KEY));

                    const provider = new AnchorProvider(
                        connection,
                        // @ts-ignore
                        { publicKey: backendWallet.publicKey, signTransaction: async (tx: any) => { tx.sign(backendWallet); return tx; }, signAllTransactions: async (txs: any[]) => { txs.forEach(t => t.sign(backendWallet)); return txs; } },
                        AnchorProvider.defaultOptions()
                    );

                    const program = new Program(onchainAcademyIdl as any, provider);
                    const learner = new PublicKey(wallet);

                    const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId);
                    const config = await (program.account as any).config.fetch(configPda);

                    const learnerTokenAccount = getAssociatedTokenAddressSync(
                        config.xpMint, learner, true, TOKEN_2022_PROGRAM_ID
                    );

                    const accountInfo = await connection.getAccountInfo(learnerTokenAccount);
                    if (!accountInfo) {
                        console.warn(`[quiz-inngest] No token account for ${wallet}, skipping on-chain mint`);
                        return { skipped: true, reason: "no_token_account" };
                    }

                    const [minterPda] = PublicKey.findProgramAddressSync(
                        [Buffer.from("minter"), backendWallet.publicKey.toBuffer()], program.programId
                    );

                    const tx = await (program.methods as any)
                        .rewardXp(new BN(xpReward))
                        .accounts({
                            config: configPda,
                            minterRole: minterPda,
                            xpMint: config.xpMint,
                            recipientTokenAccount: learnerTokenAccount,
                            minter: backendWallet.publicKey,
                            tokenProgram: TOKEN_2022_PROGRAM_ID,
                        } as any)
                        .transaction();

                    tx.feePayer = backendWallet.publicKey;
                    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
                    tx.sign(backendWallet);

                    const signature = await connection.sendRawTransaction(tx.serialize());
                    await connection.confirmTransaction(signature, "confirmed");
                    console.log(`[quiz-inngest] Quiz ${quizId} XP minted on-chain: ${signature}`);
                    return { success: true, signature };
                } catch (e: any) {
                    console.error("[quiz-inngest] On-chain XP mint failed:", e.message);
                    return { skipped: true, error: e.message };
                }
            });
        }

        // 2. Sync DB state (records XP + XpEvent in Prisma)
        await step.run("sync-db-state", async () => {
            const user = await prisma.user.findUnique({ where: { walletAddress: wallet } });
            if (user) {
                const { createLearningProgressService } = await import("@/lib/learning-progress/prisma-impl");
                const service = createLearningProgressService(prisma);
                await service.completeQuiz({
                    userId: user.id,
                    courseId,
                    moduleId,
                    quizId,
                    xpReward
                });
            }
        });

        await step.run("invalidate-user-cache", async () => {
            await invalidatePattern(`user:${wallet}*`);
        });

        return { success: true };
    }
);
