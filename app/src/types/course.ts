export interface Track {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  trackId?: number;
  collectionAddress?: string;
}

export interface Instructor {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  twitter?: string;
  github?: string;
}

export interface Lesson {
  id: string;
  title: string;
  slug: string;
  type: "content" | "challenge";
  duration: number;
  content?: string;
  videoUrl?: string;
  challenge?: ChallengeData;
  order: number;
}

export interface ChallengeData {
  prompt: string;
  language: "rust" | "typescript" | "json";
  starterCode: string;
  solution: string;
  testCases: TestCase[];
  hints: string[];
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  label: string;
  /** Optional JS expression evaluated against `output` (string). Overrides literal comparison. */
  validator?: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  order: number;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  longDescription: string;
  thumbnail: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  track: Track;
  instructor: Instructor;
  modules: Module[];
  totalLessons: number;
  totalDuration: number;
  /** Total XP from lessons: xpPerLesson × lessonCount */
  totalXP: number;
  /** Completion bonus XP from finalize_course: ~50% of totalXP */
  bonusXP: number;
  prerequisite?: { id: string; title: string } | null;
  tags: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
  // On-chain create_course parameters
  courseId?: string;
  xpPerLesson?: number;
  lessonCount?: number;
  trackId?: number;
  trackLevel?: number;
  creator?: string;
  creatorRewardXp?: number;
  minCompletionsForReward?: number;
  prerequisiteCourseId?: string;
}

export interface CourseCardData {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  difficulty: Course["difficulty"];
  trackName: string;
  trackColor: string;
  instructorName: string;
  instructorAvatar: string;
  totalLessons: number;
  totalDuration: number;
  totalXP: number;
  bonusXP: number;
  courseId?: string; // on-chain course ID for PDA derivation
  trackSlug?: string;
  progress?: number;
}
