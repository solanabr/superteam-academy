/**
 * Clean Service Interfaces for Superteam Academy
 *
 * These interfaces define the contract for enrollment and lesson completion services.
 * They are designed to be easily replaced with real Smart Contract integrations
 * (e.g., Anchor programs on Solana Devnet/Mainnet).
 */

// ===== Enrollment Service Interface =====

export interface EnrollmentRequest {
  userId: string;
  courseId: string;
  walletAddress?: string;
  timestamp: number;
}

export interface EnrollmentResponse {
  success: boolean;
  enrollmentId: string;
  transactionSignature?: string;
  error?: string;
}

export interface IEnrollmentService {
  enroll(request: EnrollmentRequest): Promise<EnrollmentResponse>;
  unenroll(userId: string, courseId: string): Promise<{ success: boolean }>;
  getEnrollments(userId: string): Promise<string[]>;
  isEnrolled(userId: string, courseId: string): Promise<boolean>;
}

// ===== Lesson Completion Service Interface =====

export interface LessonCompletionRequest {
  userId: string;
  courseId: string;
  lessonId: string;
  walletAddress?: string;
  codeSubmission: string;
  timestamp: number;
}

export interface LessonCompletionResponse {
  success: boolean;
  xpAwarded: number;
  newTotalXp: number;
  newLevel: number;
  transactionSignature?: string;
  achievementsUnlocked: string[];
  error?: string;
}

export interface ILessonCompletionService {
  completeLesson(request: LessonCompletionRequest): Promise<LessonCompletionResponse>;
  getLessonProgress(userId: string, courseId: string): Promise<string[]>;
  isCourseCompleted(userId: string, courseId: string): Promise<boolean>;
}

// ===== NFT Certificate Service Interface =====

export interface MintCertificateRequest {
  userId: string;
  courseId: string;
  walletAddress: string;
  courseName: string;
  completedAt: number;
}

export interface MintCertificateResponse {
  success: boolean;
  mintAddress: string;
  transactionSignature: string;
  metadataUri: string;
  error?: string;
}

export interface ICertificateService {
  mintCertificate(request: MintCertificateRequest): Promise<MintCertificateResponse>;
  getCertificates(walletAddress: string): Promise<MintCertificateResponse[]>;
  verifyCertificate(mintAddress: string): Promise<boolean>;
}

// ===== XP Token Service Interface (Helius/Devnet) =====

export interface XPTokenBalance {
  walletAddress: string;
  balance: number;
  lastUpdated: number;
}

export interface IXPTokenService {
  getBalance(walletAddress: string): Promise<XPTokenBalance>;
  awardXP(walletAddress: string, amount: number): Promise<{ transactionSignature: string }>;
  getLeaderboard(limit: number): Promise<{ walletAddress: string; balance: number }[]>;
}

// ===== Stub Implementations (Replace with real Smart Contract calls) =====

export class StubEnrollmentService implements IEnrollmentService {
  private enrollments: Map<string, Set<string>> = new Map();

  async enroll(request: EnrollmentRequest): Promise<EnrollmentResponse> {
    const userEnrollments = this.enrollments.get(request.userId) || new Set();
    userEnrollments.add(request.courseId);
    this.enrollments.set(request.userId, userEnrollments);
    return {
      success: true,
      enrollmentId: `enroll_${Date.now()}`,
      transactionSignature: `stub_tx_${Date.now()}`,
    };
  }

  async unenroll(userId: string, courseId: string): Promise<{ success: boolean }> {
    const userEnrollments = this.enrollments.get(userId);
    if (userEnrollments) userEnrollments.delete(courseId);
    return { success: true };
  }

  async getEnrollments(userId: string): Promise<string[]> {
    return Array.from(this.enrollments.get(userId) || []);
  }

  async isEnrolled(userId: string, courseId: string): Promise<boolean> {
    return this.enrollments.get(userId)?.has(courseId) || false;
  }
}

export class StubLessonCompletionService implements ILessonCompletionService {
  private progress: Map<string, Set<string>> = new Map();

  async completeLesson(request: LessonCompletionRequest): Promise<LessonCompletionResponse> {
    const key = `${request.userId}_${request.courseId}`;
    const lessons = this.progress.get(key) || new Set();
    lessons.add(request.lessonId);
    this.progress.set(key, lessons);
    return {
      success: true,
      xpAwarded: 100,
      newTotalXp: lessons.size * 100,
      newLevel: Math.floor(Math.sqrt((lessons.size * 100) / 100)),
      transactionSignature: `stub_tx_${Date.now()}`,
      achievementsUnlocked: [],
    };
  }

  async getLessonProgress(userId: string, courseId: string): Promise<string[]> {
    return Array.from(this.progress.get(`${userId}_${courseId}`) || []);
  }

  async isCourseCompleted(userId: string, courseId: string): Promise<boolean> {
    const lessons = this.progress.get(`${userId}_${courseId}`);
    return (lessons?.size || 0) >= 3;
  }
}

