import { PublicKey } from "@solana/web3.js";
import { IProgressService, EnrollmentData } from "./interfaces";
import { OnChainProgressService } from "./onchain-progress.service";

/**
 * Progress service factory.
 * Uses OnChainProgressService for real Anchor PDA queries.
 * Falls back gracefully when on-chain queries fail (course not on-chain, etc.)
 */

// Local fallback for when courses aren't on-chain yet
class HybridProgressService implements IProgressService {
    private onChain = new OnChainProgressService();
    private localData: Record<string, Record<string, EnrollmentData>> = {};

    private getLocalKey(wallet: string): string {
        return `superteam_academy_enrollments_${wallet}`;
    }

    private readLocal(wallet: string): Record<string, EnrollmentData> {
        if (typeof window === "undefined") return {};
        const data = localStorage.getItem(this.getLocalKey(wallet));
        return data ? JSON.parse(data) : {};
    }

    private writeLocal(wallet: string, data: Record<string, EnrollmentData>) {
        if (typeof window === "undefined") return;
        localStorage.setItem(this.getLocalKey(wallet), JSON.stringify(data));
    }

    private parseWallet(pubkey: PublicKey | string): string {
        return typeof pubkey === "string" ? pubkey : pubkey.toString();
    }

    async getEnrollment(courseId: string, walletPublicKey: PublicKey | string): Promise<EnrollmentData | null> {
        const wallet = this.parseWallet(walletPublicKey);

        // Try on-chain first
        try {
            const onChainResult = await this.onChain.getEnrollment(courseId, walletPublicKey);
            if (onChainResult) return onChainResult;
        } catch { /* fall through */ }

        // Fallback to local
        const local = this.readLocal(wallet);
        return local[courseId] || null;
    }

    async enroll(courseId: string, walletPublicKey: PublicKey | string): Promise<void> {
        const wallet = this.parseWallet(walletPublicKey);

        // Try on-chain enrollment
        try {
            await this.onChain.enroll(courseId, walletPublicKey);
        } catch {
            // If on-chain fails (course not on-chain), store locally
        }

        // Always store locally as backup
        const local = this.readLocal(wallet);
        if (!local[courseId]) {
            local[courseId] = { courseId, completedLessons: [], isCompleted: false };
            this.writeLocal(wallet, local);
        }
    }

    async completeLesson(courseId: string, lessonIndex: number, walletPublicKey: PublicKey | string): Promise<void> {
        const wallet = this.parseWallet(walletPublicKey);

        // Try on-chain
        try {
            await this.onChain.completeLesson(courseId, lessonIndex, walletPublicKey);
        } catch (error) {
            console.warn("On-chain lesson completion failed, storing locally:", error);
        }

        // Always update local
        const local = this.readLocal(wallet);
        const enrollment = local[courseId] || { courseId, completedLessons: [], isCompleted: false };
        if (!enrollment.completedLessons.includes(lessonIndex)) {
            enrollment.completedLessons.push(lessonIndex);
        }
        local[courseId] = enrollment;
        this.writeLocal(wallet, local);
    }

    async finalizeCourse(courseId: string, walletPublicKey: PublicKey | string): Promise<void> {
        const wallet = this.parseWallet(walletPublicKey);

        try {
            await this.onChain.finalizeCourse(courseId, walletPublicKey);
        } catch (error) {
            console.warn("On-chain finalization failed, storing locally:", error);
        }

        const local = this.readLocal(wallet);
        const enrollment = local[courseId];
        if (enrollment) {
            enrollment.isCompleted = true;
            enrollment.completedAt = new Date();
            this.writeLocal(wallet, local);
        }
    }

    async getEnrolledCourses(walletPublicKey: PublicKey | string): Promise<string[]> {
        const wallet = this.parseWallet(walletPublicKey);

        // Merge on-chain and local
        let onChainCourses: string[] = [];
        try {
            onChainCourses = await this.onChain.getEnrolledCourses(walletPublicKey);
        } catch { /* */ }

        const localCourses = Object.keys(this.readLocal(wallet));
        const merged = new Set([...onChainCourses, ...localCourses]);
        return Array.from(merged);
    }

    async getAllEnrollments(walletPublicKey: PublicKey | string): Promise<Record<string, EnrollmentData>> {
        const wallet = this.parseWallet(walletPublicKey);

        let onChainEnrollments: Record<string, EnrollmentData> = {};
        try {
            onChainEnrollments = await this.onChain.getAllEnrollments(walletPublicKey);
        } catch { /* */ }

        const localEnrollments = this.readLocal(wallet);

        // On-chain takes precedence
        return { ...localEnrollments, ...onChainEnrollments };
    }
}

export const progressService = new HybridProgressService();
