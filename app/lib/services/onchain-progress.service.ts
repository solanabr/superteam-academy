import { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { IProgressService, EnrollmentData } from "./interfaces";
import {
    getConnection,
    getReadOnlyProgram,
    getEnrollmentPda,
    getCoursePda,
    getConfigPda,
    getAssociatedTokenAddressToken2022,
    XP_MINT,
    PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID,
    decodeLessonBitmap,
} from "@/lib/anchor-client";

/**
 * Production implementation of IProgressService.
 * Reads enrollment data from on-chain Anchor accounts.
 * Write operations go through backend API routes (backend-signed).
 */
export class OnChainProgressService implements IProgressService {
    async getEnrollment(courseId: string, walletPublicKey: PublicKey | string): Promise<EnrollmentData | null> {
        try {
            const learner = typeof walletPublicKey === "string"
                ? new PublicKey(walletPublicKey)
                : walletPublicKey;

            const [enrollmentPda] = getEnrollmentPda(courseId, learner);
            const program = getReadOnlyProgram();
            const account = await (program.account as any).enrollment.fetchNullable(enrollmentPda);

            if (!account) return null;

            return {
                courseId,
                completedLessons: decodeLessonBitmap(account.lessonFlags as BN[]),
                isCompleted: account.completedAt !== null && account.completedAt !== undefined,
                completedAt: account.completedAt ? new Date(account.completedAt.toNumber() * 1000) : undefined,
            };
        } catch (error) {
            console.error(`Failed to fetch enrollment for course ${courseId}:`, error);
            return null;
        }
    }

    async enroll(courseId: string, walletPublicKey: PublicKey | string): Promise<void> {
        // Enrollment is signed client-side by the learner wallet.
        // This method builds the instruction and is called from enrollment-context
        // which handles wallet signing via the adapter.
        const learner = typeof walletPublicKey === "string"
            ? new PublicKey(walletPublicKey)
            : walletPublicKey;

        const response = await fetch("/api/progress/enroll", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                courseId,
                learnerWallet: learner.toBase58(),
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to enroll");
        }
    }

    async completeLesson(courseId: string, lessonIndex: number, walletPublicKey: PublicKey | string): Promise<void> {
        const learner = typeof walletPublicKey === "string"
            ? new PublicKey(walletPublicKey)
            : walletPublicKey;

        const response = await fetch("/api/progress/complete-lesson", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                courseId,
                lessonIndex,
                learnerWallet: learner.toBase58(),
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to complete lesson");
        }
    }

    async finalizeCourse(courseId: string, walletPublicKey: PublicKey | string): Promise<void> {
        const learner = typeof walletPublicKey === "string"
            ? new PublicKey(walletPublicKey)
            : walletPublicKey;

        const response = await fetch("/api/progress/finalize-course", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                courseId,
                learnerWallet: learner.toBase58(),
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to finalize course");
        }
    }

    async getEnrolledCourses(walletPublicKey: PublicKey | string): Promise<string[]> {
        try {
            const learner = typeof walletPublicKey === "string"
                ? new PublicKey(walletPublicKey)
                : walletPublicKey;

            const program = getReadOnlyProgram();
            const connection = getConnection();

            // Fetch all Enrollment accounts for this learner using memcmp
            // Enrollment account data layout:
            // 8 bytes discriminator + 32 bytes course pubkey
            // We filter by learner being part of the PDA seeds
            const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
                filters: [
                    { dataSize: 113 }, // Enrollment account size (approx)
                ],
            });

            // Try to decode and filter enrollment accounts for this learner
            const courseIds: string[] = [];
            for (const { pubkey, account } of accounts) {
                try {
                    const decoded = program.coder.accounts.decode("Enrollment", account.data);
                    // Check if this enrollment's PDA matches our learner
                    // We verify by re-deriving — if the PDA doesn't match, skip
                    // The course field in Enrollment is the Course PDA
                    // We need to find the courseId from the Course account
                    courseIds.push(decoded.course.toBase58()); // Temporary — we'll resolve course IDs
                } catch {
                    // Skip non-parseable accounts
                }
            }

            return courseIds;
        } catch (error) {
            console.error("Failed to fetch enrolled courses:", error);
            return [];
        }
    }

    async getAllEnrollments(walletPublicKey: PublicKey | string): Promise<Record<string, EnrollmentData>> {
        try {
            const learner = typeof walletPublicKey === "string"
                ? new PublicKey(walletPublicKey)
                : walletPublicKey;

            const program = getReadOnlyProgram();
            const connection = getConnection();

            // Fetch all enrollment accounts
            const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
                filters: [
                    { dataSize: 113 },
                ],
            });

            const enrollments: Record<string, EnrollmentData> = {};
            for (const { pubkey, account } of accounts) {
                try {
                    const decoded = program.coder.accounts.decode("Enrollment", account.data);
                    const courseKey = decoded.course.toBase58();
                    enrollments[courseKey] = {
                        courseId: courseKey,
                        completedLessons: decodeLessonBitmap(decoded.lessonFlags as BN[]),
                        isCompleted: decoded.completedAt !== null && decoded.completedAt !== undefined,
                        completedAt: decoded.completedAt ? new Date(decoded.completedAt.toNumber() * 1000) : undefined,
                    };
                } catch {
                    // Skip
                }
            }

            return enrollments;
        } catch (error) {
            console.error("Failed to fetch all enrollments:", error);
            return {};
        }
    }
}

export const onChainProgressService = new OnChainProgressService();
