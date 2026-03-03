import { Connection } from "@solana/web3.js";

const USE_ONCHAIN = process.env.NEXT_PUBLIC_USE_ONCHAIN === "true";

// Since OnChainLearningService methods are already async, we can keep the interface similar
// by exporting a singleton that delegates.

export const learningProgressService = {
    async getProgress(userId: string) {
        const s = await this._get();
        return s.getProgress(userId);
    },
    async getEnrollmentProgress(userId: string, courseId: string) {
        const s = await this._get();
        return s.getEnrollmentProgress(userId, courseId);
    },
    async getXP(userId: string) {
        const s = await this._get();
        return s.getXP(userId);
    },
    async getStreak(userId: string) {
        const s = await this._get();
        return s.getStreak(userId);
    },
    async getLeaderboard(options?: any) {
        const s = await this._get();
        return s.getLeaderboard(options);
    },
    async getCredentials(userId: string, options?: any) {
        const s = await this._get();
        return s.getCredentials(userId, options);
    },
    async getCredential(id: string) {
        const s = await this._get();
        return s.getCredential(id);
    },
    async enroll(userId: string, courseId: string) {
        const s = await this._get();
        return s.enroll(userId, courseId);
    },
    async unenroll(userId: string, courseId: string) {
        const s = await this._get();
        return s.unenroll(userId, courseId);
    },
    async completeLesson(params: any) {
        const s = await this._get();
        return s.completeLesson(params);
    },
    async completeQuiz(params: any) {
        const s = await this._get();
        return s.completeQuiz(params);
    },
    async finalizeCourse(userId: string, courseId: string, lessonCount: number) {
        const s = await this._get();
        return s.finalizeCourse(userId, courseId, lessonCount);
    },
    async claimCompletionBonus(userId: string, courseId: string, xpAmount: number) {
        const s = await this._get();
        return s.claimCompletionBonus(userId, courseId, xpAmount);
    },
    async logActivity(userId: string): Promise<boolean> {
        const s = await this._get();
        return s.logActivity(userId);
    },
    async issueCredential(params: any) {
        const s = await this._get();
        return s.issueCredential(params);
    },
    async claimAchievement(userId: string, achievementId: string) {
        const s = await this._get();
        return s.claimAchievement(userId, achievementId);
    },

    _instance: null as any,
    async _get() {
        if (this._instance) return this._instance;

        const { OnChainLearningService } = await import("@/lib/learning-progress/onchain-impl");
        const { RPC_URL } = await import("@/lib/solana-connection");
        const conn = new Connection(RPC_URL);

        if (USE_ONCHAIN) {
            let dbService: any;
            // Only attempt to load Prisma service on the server
            if (typeof window === "undefined") {
                try {
                    const { prisma } = await import("@/lib/db");
                    const { createLearningProgressService } = await import("@/lib/learning-progress/prisma-impl");
                    dbService = createLearningProgressService(prisma);
                } catch (e) {
                    console.error("[LearningProgressService] Failed to load server-side DB fallback:", e);
                }
            }
            this._instance = new OnChainLearningService(conn, dbService);
        } else {
            // Traditional: Prisma Only (Server only)
            if (typeof window !== "undefined") {
                // Return a client-side version of the service if needed, 
                // but usually, we shouldn't be here in off-chain mode on the client.
                this._instance = new OnChainLearningService(conn);
            } else {
                const { prisma } = await import("@/lib/db");
                const { createLearningProgressService } = await import("@/lib/learning-progress/prisma-impl");
                this._instance = createLearningProgressService(prisma);
            }
        }
        return this._instance;
    }
};
