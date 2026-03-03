/**
 * LearningProgressService — Clean abstraction layer for all on-chain interactions.
 *
 * This service defines a typed interface that maps 1:1 to the Anchor program instructions.
 * The current implementation uses mock data for frontend development.
 * To connect to the real program, swap the MockLearningProgressService for
 * an AnchorLearningProgressService that builds and submits real transactions.
 */

import { PublicKey, Connection } from "@solana/web3.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Credential {
    mint: string;
    name: string;
    image: string;
    courseId: number;
    xpEarned: number;
    issuedAt: string;
}

export interface LeaderboardEntry {
    rank: number;
    wallet: string;
    username: string;
    xp: number;
    level: number;
    coursesCompleted: number;
}

export interface EnrollmentState {
    isEnrolled: boolean;
    bitmap: bigint[];
    lessonsCompleted: number;
    totalLessons: number;
}

export interface CourseStats {
    totalEnrollments: number;
    completionRate: number;
    avgXpEarned: number;
}

// ─── Interface ───────────────────────────────────────────────────────────────

export interface ILearningProgressService {
    // Read operations
    getXpBalance(wallet: PublicKey): Promise<number>;
    getCredentials(wallet: PublicKey): Promise<Credential[]>;
    getLeaderboard(period?: "weekly" | "monthly" | "all"): Promise<LeaderboardEntry[]>;
    getEnrollmentState(courseId: number, wallet: PublicKey): Promise<EnrollmentState>;
    getCourseStats(courseId: number): Promise<CourseStats>;

    // Write operations (return transaction signature)
    enroll(courseId: number): Promise<string>;
    completeLesson(courseId: number, lessonIndex: number): Promise<string>;
    finalizeCourse(courseId: number): Promise<string>;
    claimAchievement(achievementId: number): Promise<string>;
}

// ─── Mock Implementation ─────────────────────────────────────────────────────

export class MockLearningProgressService implements ILearningProgressService {
    async getXpBalance(_wallet: PublicKey): Promise<number> {
        return 2450; // Simulated XP
    }

    async getCredentials(_wallet: PublicKey): Promise<Credential[]> {
        return [
            {
                mint: "CREDxyz...mock",
                name: "Anchor Developer — Level 1",
                image: "/placeholder-credential.png",
                courseId: 1,
                xpEarned: 500,
                issuedAt: new Date().toISOString(),
            },
        ];
    }

    async getLeaderboard(
        _period?: "weekly" | "monthly" | "all"
    ): Promise<LeaderboardEntry[]> {
        return [
            { rank: 1, wallet: "Abc1...xyz", username: "solana_dev42", xp: 12500, level: 11, coursesCompleted: 5 },
            { rank: 2, wallet: "Def2...xyz", username: "anchor_master", xp: 9800, level: 9, coursesCompleted: 4 },
            { rank: 3, wallet: "Ghi3...xyz", username: "defi_wizard", xp: 7200, level: 8, coursesCompleted: 3 },
        ];
    }

    async getEnrollmentState(
        _courseId: number,
        _wallet: PublicKey
    ): Promise<EnrollmentState> {
        return {
            isEnrolled: false,
            bitmap: [BigInt(0), BigInt(0), BigInt(0), BigInt(0)],
            lessonsCompleted: 0,
            totalLessons: 8,
        };
    }

    async getCourseStats(_courseId: number): Promise<CourseStats> {
        return { totalEnrollments: 247, completionRate: 0.68, avgXpEarned: 420 };
    }

    async enroll(_courseId: number): Promise<string> {
        await new Promise((r) => setTimeout(r, 1200));
        return "mock_tx_signature_enroll_" + Date.now();
    }

    async completeLesson(
        _courseId: number,
        _lessonIndex: number
    ): Promise<string> {
        await new Promise((r) => setTimeout(r, 1000));
        return "mock_tx_signature_lesson_" + Date.now();
    }

    async finalizeCourse(_courseId: number): Promise<string> {
        await new Promise((r) => setTimeout(r, 1500));
        return "mock_tx_signature_finalize_" + Date.now();
    }

    async claimAchievement(_achievementId: number): Promise<string> {
        await new Promise((r) => setTimeout(r, 800));
        return "mock_tx_signature_achievement_" + Date.now();
    }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

// Use this across the application. To connect to real program,
// replace with: new AnchorLearningProgressService(connection, wallet)
export const learningService: ILearningProgressService =
    new MockLearningProgressService();
