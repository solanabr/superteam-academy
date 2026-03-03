import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { getProgram } from '@/lib/anchor';
import {
  getCoursePda,
  getEnrollmentPda,
  Course as OnChainCourse,
  Enrollment as OnChainEnrollment,
  isCourseComplete,
  countCompletedLessons,
  getCompletedLessonIndices,
} from '@/lib/anchor';
import { READ_ONLY_WALLET, type UntypedAccountAccess, type AccountWrapper } from '@/lib/types/shared';

/**
 * On-Chain Course Service
 * Fetches and manages course data from the Anchor program
 */

export interface CourseProgress {
  courseId: string;
  lessonCount: number;
  completedLessons: number; // Count of completed lessons
  completedLessonIndices: number[]; // Array of lesson indices
  progress: number; // 0-100
  isComplete: boolean;
  enrolledAt: number;
  completedAt: number | null;
  credentialAsset: PublicKey | null;
}

export class OnchainCourseService {
  private program: Program;

  constructor(connection: Connection) {
    const provider = new AnchorProvider(connection, READ_ONLY_WALLET, { commitment: 'confirmed' });
    this.program = getProgram(provider);
  }

  /**
   * Get all active courses
   */
  async getAllCourses(): Promise<OnChainCourse[]> {
    try {
      const allCourses = await (this.program.account as unknown as UntypedAccountAccess).course.all();
      return allCourses
        .filter((c: AccountWrapper) => (c.account as Record<string, unknown>).isActive)
        .map((c: AccountWrapper) => c.account as unknown as OnChainCourse)
        .sort((a: OnChainCourse, b: OnChainCourse) => b.createdAt - a.createdAt);
    } catch (error) {
      // Expected when Anchor program is not deployed or unreachable
      console.warn('On-chain courses unavailable, falling back to local data');
      return [];
    }
  }

  /**
   * Get a single course by ID
   */
  async getCourse(courseId: string): Promise<OnChainCourse | null> {
    try {
      const [coursePda] = getCoursePda(courseId);
      const course = await (this.program.account as unknown as UntypedAccountAccess).course.fetch(coursePda) as unknown as OnChainCourse;
      return course.isActive ? course : null;
    } catch (error) {
      // Expected when on-chain account doesn't exist yet (e.g. mock courses)
      return null;
    }
  }

  /**
   * Get courses by track
   */
  async getCoursesByTrack(trackId: number): Promise<OnChainCourse[]> {
    const allCourses = await this.getAllCourses();
    return allCourses.filter((c) => c.trackId === trackId);
  }

  /**
   * Get courses by difficulty (0-3)
   */
  async getCoursesByDifficulty(difficulty: number): Promise<OnChainCourse[]> {
    const allCourses = await this.getAllCourses();
    return allCourses.filter((c) => c.difficulty === difficulty);
  }

  /**
   * Get courses by creator
   */
  async getCoursesByCreator(creator: PublicKey): Promise<OnChainCourse[]> {
    const allCourses = await this.getAllCourses();
    return allCourses.filter((c) => c.creator.equals(creator));
  }

  /**
   * Get learner enrollment in a course
   */
  async getEnrollment(
    courseId: string,
    learnerAddress: PublicKey
  ): Promise<OnChainEnrollment | null> {
    try {
      const [enrollmentPda] = getEnrollmentPda(courseId, learnerAddress);
      return await (this.program.account as unknown as UntypedAccountAccess).enrollment.fetchNullable(enrollmentPda) as unknown as OnChainEnrollment | null;
    } catch (error) {
      console.error(
        `Error fetching enrollment for ${courseId} and ${learnerAddress}:`,
        error
      );
      return null;
    }
  }

  /**
   * Get learner's progress in a course
   */
  async getCourseProgress(
    courseId: string,
    learnerAddress: PublicKey
  ): Promise<CourseProgress | null> {
    try {
      const enrollment = await this.getEnrollment(courseId, learnerAddress);
      if (!enrollment) {
        return null;
      }

      const course = await this.getCourse(courseId);
      if (!course) {
        return null;
      }

      const completedLessons = countCompletedLessons(enrollment.lessonFlags);
      const completedLessonIndices = getCompletedLessonIndices(enrollment.lessonFlags, course.lessonCount);
      const progress = Math.round((completedLessons / course.lessonCount) * 100);
      const isComplete = isCourseComplete(enrollment.lessonFlags, course.lessonCount);

      return {
        courseId,
        lessonCount: course.lessonCount,
        completedLessons,
        completedLessonIndices,
        progress,
        isComplete,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
        credentialAsset: enrollment.credentialAsset,
      };
    } catch (error) {
      console.error(
        `Error calculating progress for ${courseId} and ${learnerAddress}:`,
        error
      );
      return null;
    }
  }

  /**
   * Get all learner enrollments
   */
  async getLearnerEnrollments(learnerAddress: PublicKey): Promise<CourseProgress[]> {
    try {
      const allCourses = await this.getAllCourses();
      const enrollments: CourseProgress[] = [];

      for (const course of allCourses) {
        const progress = await this.getCourseProgress(course.courseId, learnerAddress);
        if (progress) {
          enrollments.push(progress);
        }
      }

      return enrollments.sort((a, b) => b.enrolledAt - a.enrolledAt);
    } catch (error) {
      console.error(`Error fetching enrollments for ${learnerAddress}:`, error);
      return [];
    }
  }

  /**
   * Get learner's completed courses
   */
  async getCompletedCourses(learnerAddress: PublicKey): Promise<CourseProgress[]> {
    const enrollments = await this.getLearnerEnrollments(learnerAddress);
    return enrollments.filter((e) => e.isComplete);
  }

  /**
   * Search courses by text
   */
  async searchCourses(query: string): Promise<OnChainCourse[]> {
    const allCourses = await this.getAllCourses();
    const lowerQuery = query.toLowerCase();

    return allCourses.filter(
      (c) =>
        c.courseId.toLowerCase().includes(lowerQuery) ||
        c.creator.toString().includes(lowerQuery)
    );
  }

  /**
   * Get course stats
   */
  async getCourseStats(courseId: string): Promise<{ completions: number; activeLearners: number } | null> {
    try {
      const course = await this.getCourse(courseId);
      if (!course) return null;

      return {
        completions: course.completionCount,
        activeLearners: 0, // Would need to count distinct learners with enrollments
      };
    } catch (error) {
      console.error(`Error fetching stats for ${courseId}:`, error);
      return null;
    }
  }
}

/**
 * Create OnchainCourseService from connection
 */
export function createOnchainCourseService(connection: Connection): OnchainCourseService {
  return new OnchainCourseService(connection);
}
