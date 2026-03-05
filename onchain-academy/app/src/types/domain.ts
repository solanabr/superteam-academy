export type Difficulty = "beginner" | "intermediate" | "advanced";
export type LessonKind = "reading" | "challenge" | "video";
export type Locale = "en" | "pt-BR" | "es";
export type Timeframe = "weekly" | "monthly" | "all-time";

export type CourseSummary = {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  durationMinutes: number;
  xpTotal: number;
  track: string;
  moduleCount: number;
  lessonCount: number;
  imageUrl?: string;
};

export type Lesson = {
  id: string;
  title: string;
  module: string;
  type: LessonKind;
  markdown: string;
  videoUrl?: string;
  starterCode?: string;
  language?: "rust" | "typescript" | "json";
};

export type CourseDetail = CourseSummary & {
  lessons: Lesson[];
};

export type UserProgressSummary = {
  courseId: string;
  completionPercent: number;
  completedLessons: number;
  totalLessons: number;
  xpEarned: number;
  updatedAt: string;
};

export type UserCourseProgress = {
  userId: string;
  courseId: string;
  completionPercent: number;
  completedLessons: number;
  totalLessons: number;
  xpEarned: number;
  level: number;
  streak: number;
};

export type CredentialViewModel = {
  credentialId: string;
  title: string;
  track: string;
  level: number;
  coursesCompleted: number;
  totalXp: number;
  mintAddress: string;
  metadataUri: string | null;
  explorerUrl: string;
  verified: boolean;
  source: "helius";
};

export type Credential = CredentialViewModel;

export type StreakDay = {
  date: string;
  active: boolean;
  bonusApplied: boolean;
};

export type StreakData = {
  currentDays: number;
  longestDays: number;
  freezesLeft: number;
  calendar: StreakDay[];
};

export type LeaderboardEntry = {
  rank: number;
  walletAddress: string;
  displayName: string;
  xp: number;
  level: number;
  streak: number;
  timeframe: Timeframe;
};

export type ChallengeExecutionResult = {
  challengeId: string;
  passed: boolean;
  output: string;
  testCases: Array<{ id: string; label: string; passed: boolean }>;
};
