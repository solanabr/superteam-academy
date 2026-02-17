import {
    IEnrollmentService,
    EnrollmentRequest,
    EnrollmentResponse
} from '../interfaces';
import { LocalStorageManager } from './storage';

export class LocalEnrollmentService implements IEnrollmentService {
    private getKey(userId: string) {
        return `enrollments_${userId}`;
    }

    async enroll(request: EnrollmentRequest): Promise<EnrollmentResponse> {
        const key = this.getKey(request.userId);
        const existing = LocalStorageManager.getItem<string[]>(key) || [];

        if (!existing.includes(request.courseId)) {
            existing.push(request.courseId);
            LocalStorageManager.setItem(key, existing);
        }

        return {
            success: true,
            enrollmentId: `enroll_${Date.now()}`,
            transactionSignature: `local_tx_${Date.now()}`,
        };
    }

    async unenroll(userId: string, courseId: string): Promise<{ success: boolean }> {
        const key = this.getKey(userId);
        const existing = LocalStorageManager.getItem<string[]>(key) || [];

        const updated = existing.filter(id => id !== courseId);
        LocalStorageManager.setItem(key, updated);

        return { success: true };
    }

    async getEnrollments(userId: string): Promise<string[]> {
        return LocalStorageManager.getItem<string[]>(this.getKey(userId)) || [];
    }

    async isEnrolled(userId: string, courseId: string): Promise<boolean> {
        const enrollments = await this.getEnrollments(userId);
        return enrollments.includes(courseId);
    }
}
