export type Difficulty = 1 | 2 | 3;

export type ContentLesson = {
  id: string;
  title: string;
  type: "content";
  duration: number;
  xp: number;
  body: string;
  videoUrl?: string;
};

export type ChallengeLesson = {
  id: string;
  title: string;
  type: "challenge";
  duration: number;
  xp: number;
  prompt: string;
  starterCode: string;
  language: "rust" | "typescript";
  testCases: TestCase[];
};

export type TestCase = {
  input: string;
  expectedOutput: string;
  label: string;
};

export type Lesson = ContentLesson | ChallengeLesson;

export type Module = {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
};

export type Creator = {
  name: string;
  avatar: string;
  title: string;
};

export type Track = {
  id: string;
  name: string;
  description: string;
  slug: string;
  icon: string;
  courseCount: number;
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  trackId: string;
  difficulty: Difficulty;
  modules: Module[];
  totalLessons: number;
  totalDuration: number;
  xpReward: number;
  enrollmentCount: number;
  creator: Creator;
  prerequisiteSlug: string | null;
  isActive: boolean;
  tags: string[];
};

export type SortOption = "popular" | "newest" | "xp-high" | "xp-low";

export type FilterParams = {
  q?: string;
  difficulty?: Difficulty;
  track?: string;
  sort?: SortOption;
};
