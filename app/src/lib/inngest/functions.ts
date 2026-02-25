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
    const result = await connection.confirmTransaction(signature);
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
