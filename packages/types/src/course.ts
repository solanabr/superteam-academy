export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface Instructor {
  name: string;
  avatar: string;
  bio: string;
  socialLinks?: { twitter?: string; github?: string };
}

export interface TestCase {
  id: string;
  description: string;
  input: string;
  expectedOutput: string;
  hidden?: boolean;
}

interface LessonBase {
  _id: string;
  title: string;
  slug: string;
  order: number;
  difficulty?: Difficulty;
  xpReward: number;
  videoUrl?: string;
}

export interface ContentLesson extends LessonBase {
  type: "content";
  content: string;
  language?: "typescript" | "rust";
  widgets?: string[];
  programIdl?: string;
}

export type BuildType = "standard" | "buildable";

export interface ChallengeLesson extends LessonBase {
  type: "challenge";
  content: string;
  language?: "typescript" | "rust";
  buildType?: BuildType;
  deployable?: boolean;
  code: string;
  tests: TestCase[];
  hints: string[];
  solution: string;
}

export interface BuildResult {
  success: boolean;
  stderr: string;
  uuid: string | null;
  /** Base64-encoded .so binary from build server (avoids Cloud Run routing issues). */
  binary_b64?: string;
}

export interface BuildFile {
  path: string;
  content: string;
}

export type Lesson = ContentLesson | ChallengeLesson;

export interface Module {
  _id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  order: number;
}

export interface Course {
  _id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: Difficulty;
  duration: number;
  thumbnail: string;
  instructor: Instructor;
  tags: string[];
  xpReward: number;
  modules: Module[];
  trackCollectionAddress?: string | null;
}

export interface LearningPath {
  _id: string;
  title: string;
  description: string;
  slug: string;
  courses: Course[];
  difficulty: Difficulty;
}
