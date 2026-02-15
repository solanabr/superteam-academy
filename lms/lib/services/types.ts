import type { Course } from "@/types/course";
import type { Progress, LeaderboardEntry, StreakData, UserProfile } from "@/types/user";
import type { Achievement } from "@/types/gamification";
import type { Credential } from "@/types/credential";
import type { Thread, Reply, Endorsement, CommunityStats } from "@/types/community";

export interface CompleteLessonResult {
  ok: boolean;
  txSignature: string | null;
  finalizeTxSignature: string | null;
  credentialTxSignature: string | null;
}

export interface OnChainResult {
  ok: boolean;
  txSignature: string | null;
}

export interface PracticeProgressData {
  completed: string[];
  txHashes: Record<string, string>;
  claimedMilestones: number[];
  milestoneTxHashes: Record<string, string>;
}

export interface LearningProgressService {
  getProgress(userId: string, courseId: string): Promise<Progress | null>;
  getAllProgress(userId: string): Promise<Progress[]>;
  completeLesson(userId: string, courseId: string, lessonIndex: number): Promise<CompleteLessonResult>;
  enrollInCourse(userId: string, courseId: string): Promise<OnChainResult>;
  unenrollFromCourse(userId: string, courseId: string): Promise<void>;
  getXP(userId: string): Promise<number>;
  getLevel(userId: string): Promise<number>;
  getStreak(userId: string): Promise<StreakData>;
  getLeaderboard(timeframe: "weekly" | "monthly" | "all-time"): Promise<LeaderboardEntry[]>;
  getCredentials(wallet: string): Promise<Credential[]>;
  getAchievements(userId: string): Promise<Achievement[]>;
  claimAchievement(userId: string, achievementId: number): Promise<OnChainResult>;
  getProfile(userId: string): Promise<UserProfile | null>;
  getDisplayName(userId: string): Promise<string | null>;
  setDisplayName(userId: string, name: string): Promise<void>;
  setBio(userId: string, bio: string): Promise<void>;
  getBio(userId: string): Promise<string | null>;
  getCourses(): Promise<Course[]>;
  getCourse(courseId: string): Promise<Course | null>;
  getPracticeProgress(userId: string): Promise<PracticeProgressData>;
  completePracticeChallenge(userId: string, challengeId: string, xpReward: number): Promise<OnChainResult>;

  // Community
  getThreads(params?: { type?: string; tag?: string; sort?: string; page?: number }): Promise<ThreadListResult>;
  getThread(id: string): Promise<Thread>;
  createThread(userId: string, title: string, body: string, type: string, tags: string[]): Promise<OnChainResult & { thread: Thread }>;
  getReplies(threadId: string): Promise<Reply[]>;
  createReply(userId: string, threadId: string, body: string): Promise<OnChainResult & { reply: Reply }>;
  upvote(userId: string, targetId: string, targetType: "thread" | "reply"): Promise<{ ok: boolean; upvotes: string[] }>;
  markSolution(userId: string, threadId: string, replyId: string): Promise<OnChainResult>;
  getEndorsements(wallet: string): Promise<Endorsement[]>;
  endorseUser(endorser: string, endorsee: string, message?: string): Promise<OnChainResult>;
  getCommunityStats(userId: string): Promise<CommunityStats>;
}

export interface ThreadListResult {
  threads: Thread[];
  total: number;
  page: number;
  totalPages: number;
}
