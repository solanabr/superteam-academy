export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export type Course = {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  durationHours: number;
  xpReward: number;
  lessons: Lesson[];
  track: string;
  thumbnailUrl: string; // Added for premium UI
};

export type Lesson = {
  id: string;
  title: string;
  moduleTitle: string;
  durationMinutes: number;
  type: "content" | "challenge";
  markdown: string;
  starterCode: string;
  testCases: string[];
  exam?: {
    question: string;
    options: string[];
    correctOptionIndex: number;
  };
};

export type LearningProgress = {
  courseId: string;
  completedLessonIds: string[];
  percentComplete: number;
  updatedAt: string;
};

export type Credential = {
  id: string;
  track: string;
  level: number;
  coursesCompleted: number;
  totalXp: number;
  mintAddress: string;
  explorerUrl: string;
  imageUrl: string; // Added for premium UI
};

export type LeaderboardEntry = {
  rank: number;
  wallet: string;
  name: string;
  xp: number;
  level: number;
  streak: number;
  avatarUrl?: string; // Added for premium UI
};
