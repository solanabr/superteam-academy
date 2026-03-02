// ── Result types (service layer) ─────────────────────────────────────────────

export interface TransactionResult {
  signature?: string;
}

export interface LessonCompletionResult extends TransactionResult {
  xpEarned: number;
  courseCompleted: boolean;
}

export interface CourseFinalizationResult extends TransactionResult {
  totalXp: number;
  bonusXp: number;
  creatorXp: number;
  credentialAsset?: string;
}

// Course types
export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail: string;
  difficulty: string;
  duration: string; // e.g. "8 hours"
  lessonCount: number;
  challengeCount: number;
  xpTotal: number;
  trackId: number;
  trackLevel: number;
  trackName: string;
  creator: string;
  creatorAvatar?: string;
  isActive: boolean;
  totalEnrollments: number;
  totalCompletions: number;
  modules: Module[];
  prerequisites?: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  type: "content" | "challenge";
  order: number;
  xpReward: number;
  content?: string; // markdown or HTML from Lexical
  videoUrl?: string; // YouTube/Vimeo embed URL
  challenge?: Challenge;
  duration: string;
  completed?: boolean;
}

export interface Challenge {
  id: string;
  prompt: string;
  starterCode: string;
  language: "rust" | "typescript" | "json";
  testCases: TestCase[];
  hints: string[];
  solution?: string;
}

export interface TestCase {
  id: string;
  name: string;
  input: string;
  expectedOutput: string;
  passed?: boolean;
}

// Progress types
export interface Progress {
  courseId: string;
  completedLessons: number[];
  totalLessons: number;
  percentage: number;
  enrolledAt: string;
  completedAt?: string;
  lastAccessedAt: string;
  enrollmentPda?: string;
  isFinalized?: boolean;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  streakFreezes: number;
  activityCalendar: Record<string, boolean>; // date string -> active
}

export interface LeaderboardEntry {
  rank: number;
  wallet: string;
  displayName?: string;
  avatar?: string;
  xp: number;
  level: number;
  streak: number;
}

// Achievement types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "progress" | "streaks" | "skills" | "community" | "special";
  xpReward: number;
  claimed: boolean;
  claimedAt?: string;
}

// Credential types
export interface Credential {
  trackId: number;
  trackName: string;
  currentLevel: number;
  coursesCompleted: number;
  totalXpEarned: number;
  firstEarned?: string;
  lastUpdated: string;
  mintAddress?: string;
  metadataUri?: string;
  badgeImage?: string;
  collectionAddress?: string;
}

// User types
export interface UserProfile {
  id: string;
  wallet?: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  socialLinks: {
    twitter?: string;
    github?: string;
    discord?: string;
  };
  joinedAt: string;
  isPublic: boolean;
  xp: number;
  level: number;
  rank?: number;
  streak: StreakData;
  achievements: Achievement[];
  credentials: Credential[];
  completedCourses: string[];
  enrolledCourses: string[];
  skills: Record<string, number>; // skill name -> proficiency 0-100
}

// Lesson navigation item (used in lesson page decomposition)
export interface LessonNavItem {
  lesson: Lesson;
  moduleTitle: string;
}

export interface FlattenedLesson {
  lesson: Lesson;
  moduleTitle: string;
  moduleIndex: number;
}

// Notification types
export type NotificationType =
  | "xp_milestone"
  | "level_up"
  | "achievement"
  | "course_announcement"
  | "reply"
  | "mention";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

// Discussion types
export type {
  ThreadScope,
  ThreadCategory,
  VoteValue,
  ThreadAuthor,
  ThreadListItem,
  ThreadDetail,
  CommentNode,
  CreateThreadPayload,
  CreateCommentPayload,
  ThreadListParams,
  ThreadListResponse,
} from "./discussions";

// Learning path
export interface LearningPath {
  id: string;
  name: string;
  description: string;
  icon: string;
  courses: string[]; // course slugs in order
  color: string;
}
