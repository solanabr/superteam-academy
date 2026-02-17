export interface Track {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
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
  xpReward: number;
  content?: string;
  videoUrl?: string;
  challenge?: ChallengeData;
  order: number;
}

export interface ChallengeData {
  prompt: string;
  language: "rust" | "typescript";
  starterCode: string;
  solution: string;
  testCases: TestCase[];
  hints: string[];
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  label: string;
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
  totalXP: number;
  prerequisites: string[];
  tags: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
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
  progress?: number;
}
