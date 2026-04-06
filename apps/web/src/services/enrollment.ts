import type { CourseId, WalletAddress } from "./models";

export interface EnrollmentSummary {
  courseId: CourseId;
  enrolledAt: string;
  completedAt: string | null;
}

export interface EnrollmentService {
  enroll(params: {
    wallet: WalletAddress;
    courseId: CourseId;
  }): Promise<EnrollmentSummary>;

  getEnrollment(params: {
    wallet: WalletAddress;
    courseId: CourseId;
  }): Promise<EnrollmentSummary | null>;

  closeEnrollment(params: {
    wallet: WalletAddress;
    courseId: CourseId;
  }): Promise<void>;
}

class StubEnrollmentService implements EnrollmentService {
  async enroll({ courseId }: { wallet: WalletAddress; courseId: CourseId }) {
    return {
      courseId,
      enrolledAt: new Date().toISOString(),
      completedAt: null
    };
  }

  async getEnrollment(): Promise<EnrollmentSummary | null> {
    return null;
  }

  async closeEnrollment(): Promise<void> {
    return;
  }
}

export const enrollmentService: EnrollmentService = new StubEnrollmentService();

