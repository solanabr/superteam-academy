import type { Enrollment } from "@/types";

export interface EnrollmentService {
  enroll(userId: string, courseId: string, totalLessons?: number): Promise<Enrollment>;
  getEnrollment(userId: string, courseId: string): Promise<Enrollment | null>;
  getEnrollments(userId: string): Promise<Enrollment[]>;
  isEnrolled(userId: string, courseId: string): Promise<boolean>;
  closeEnrollment(userId: string, courseId: string): Promise<void>;
}
