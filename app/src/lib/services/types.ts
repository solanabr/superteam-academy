export interface CourseData {
  courseId: string;
  creator: string;
  lessonCount: number;
  difficulty: 1 | 2 | 3;
  xpPerLesson: number;
  trackId: number;
  trackLevel: number;
  prerequisite: string | null;
  isActive: boolean;
  totalCompletions: number;
  totalEnrollments: number;
  createdAt: number;
}

export interface EnrollmentData {
  course: string;
  enrolledAt: number;
  completedAt: number | null;
  lessonFlags: number[];
  credentialAsset: string | null;
}

export interface CredentialData {
  address: string;
  name: string;
  uri: string;
  trackId: number;
  level: number;
  coursesCompleted: number;
  totalXp: number;
  image: string;
}

export interface LeaderboardEntry {
  wallet: string;
  xp: number;
  level: number;
  rank: number;
}

export interface TransactionResult {
  signature: string;
  success: boolean;
  error?: string;
}
