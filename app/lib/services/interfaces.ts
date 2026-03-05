import { PublicKey } from "@solana/web3.js";
import { Course, Module, Lesson } from "../types";

// ==========================================
// 1. Content Service (Off-Chain / CMS)
// ==========================================
export interface IContentService {
    /**
     * Fetch all available courses (metadata only)
     */
    getCourses(): Promise<Course[]>;

    /**
     * Fetch a specific course by slug including its module/lesson structure
     */
    getCourseBySlug(slug: string): Promise<Course | null>;

    /**
     * Fetch full content/markdown for a specific lesson
     */
    getLesson(courseSlug: string, lessonId: string): Promise<Lesson | null>;
}

// ==========================================
// 2. Progress Service (On-Chain / Anchor)
// ==========================================
export interface EnrollmentData {
    courseId: string;
    completedLessons: number[]; // Indices of completed lessons (derived from 256-bit bitmap)
    isCompleted: boolean;
    completedAt?: Date;
}

export interface IProgressService {
    /**
     * Checks if a learner is enrolled in a course
     */
    getEnrollment(courseId: string, walletPublicKey: PublicKey | string): Promise<EnrollmentData | null>;

    /**
     * Enrolls the learner in a course (Signs and sends Anchor enroll tx)
     */
    enroll(courseId: string, walletPublicKey: PublicKey | string): Promise<void>;

    /**
     * Marks a lesson as complete (Backend signed Anchor complete_lesson tx)
     */
    completeLesson(courseId: string, lessonIndex: number, walletPublicKey: PublicKey | string): Promise<void>;

    /**
     * Finalizes a course once all lessons are complete
     */
    finalizeCourse(courseId: string, walletPublicKey: PublicKey | string): Promise<void>;

    /**
     * Gets all course IDs a wallet is enrolled in
     */
    getEnrolledCourses(walletPublicKey: PublicKey | string): Promise<string[]>;

    /**
     * Gets raw enrollment data for all enrolled courses to render progress bars
     */
    getAllEnrollments(walletPublicKey: PublicKey | string): Promise<Record<string, EnrollmentData>>;
}

// ==========================================
// 3. XP Service (On-Chain / Token-2022)
// ==========================================
export interface IXpService {
    /**
     * Gets the total Token-2022 XP balance for a wallet
     */
    getXpBalance(walletPublicKey: PublicKey | string): Promise<number>;

    /**
     * Gets the derived level based on total XP
     */
    getLevel(xp: number): number;

    /**
     * Gets the XP required to reach a specific level
     */
    getXpForLevel(level: number): number;

    /**
     * Calculates the progress percentage (0-100) towards the next level
     */
    getLevelProgress(xp: number): {
        currentLevel: number;
        currentLevelXp: number;
        nextLevelXp: number;
        progressPercent: number;
    };
}

// ==========================================
// 4. Credential Service (On-Chain / Metaplex Core)
// ==========================================
export interface CredentialNFT {
    assetId: string;
    name: string;
    imageUri: string;
    trackId: number;
    level: number;
    coursesCompleted: number;
    totalXp: number;
}

export interface ICredentialService {
    /**
     * Fetches all course completion credentials for a wallet via Helius DAS
     */
    getCredentials(walletPublicKey: PublicKey | string): Promise<CredentialNFT[]>;
}
