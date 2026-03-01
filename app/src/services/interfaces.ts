import type {
  Enrollment,
  UserProfile,
  UserStats,
  ProfileUpdateData,
} from "@/types/user";
import type {
  StreakData,
  Achievement,
  LeaderboardEntry,
  XPTransaction,
} from "@/types/gamification";
import type { RunResult } from "@/types/challenge";
import type { TestCase } from "@/types/course";

export interface Progress {
  courseId: string;
  completedLessons: number[];
  totalLessons: number;
  progressPct: number;
  completedAt: string | null;
}

export interface Credential {
  id: string;
  trackId: number;
  trackName: string;
  level: number;
  issuedAt: string;
  walletAddress: string;
  mintAddress?: string;
  coursesCompleted?: number;
  totalXp?: number;
  completedCourseIds?: string[];
  imageUrl?: string;
  explorerUrl?: string;
}

export interface LearningProgressService {
  getProgress(userId: string, courseId: string): Promise<Progress>;
  completeLesson(
    userId: string,
    courseId: string,
    lessonIndex: number,
  ): Promise<void>;
  getEnrollments(userId: string): Promise<Enrollment[]>;
  enroll(userId: string, courseId: string): Promise<void>;
  unenroll(userId: string, courseId: string): Promise<void>;
}

export interface GamificationService {
  getXP(userId: string): Promise<number>;
  getLevel(userId: string): Promise<number>;
  getStreak(userId: string): Promise<StreakData>;
  awardXP(
    userId: string,
    amount: number,
    source: string,
    sourceId?: string,
  ): Promise<void>;
  /** Update streak without awarding XP (for on-chain lesson completion). */
  recordActivity(userId: string): Promise<void>;
  getAchievements(userId: string): Promise<Achievement[]>;
  claimAchievement(userId: string, achievementIndex: number): Promise<void>;
  getXPHistory(userId: string, limit?: number): Promise<XPTransaction[]>;
}

export interface LeaderboardService {
  getLeaderboard(params: {
    timeframe: "weekly" | "monthly" | "alltime";
    courseId?: string;
  }): Promise<{
    entries: LeaderboardEntry[];
    lastSyncedAt: string | null;
  }>;
  getUserRank(params: {
    userId: string;
    timeframe: "weekly" | "monthly" | "alltime";
    courseId?: string;
  }): Promise<number>;
  syncLeaderboardWithOnchainData(): Promise<{ processed: number; lastSignature: string | null }>;
}

export type { OnChainSyncService, XpMintRecord } from "./onchain-sync";

export interface CredentialService {
  getCredentials(walletAddress: string): Promise<Credential[]>;
  getCredentialByTrack(
    walletAddress: string,
    trackId: number,
  ): Promise<Credential | null>;
  collectCredential(params: {
    courseId: string;
    learnerWallet: string;
  }): Promise<CredentialIssuanceResult>;
}

export interface ProfileService {
  getProfileByUsername(username: string): Promise<UserProfile | null>;
  getProfileById(userId: string): Promise<UserProfile | null>;
  updateProfile(userId: string, data: ProfileUpdateData): Promise<UserProfile>;
  checkUsernameAvailable(
    username: string,
    excludeUserId?: string,
  ): Promise<boolean>;
  getProfileStats(userId: string): Promise<UserStats | null>;
  /** Seed profile + user_stats rows on first login. No-op if already exists. */
  ensureProfile(user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    preferredTheme?: string;
    preferredLanguage?: string;
  }): Promise<void>;
}

export interface ChallengeService {
  runCode(
    code: string,
    language: string,
    testCases: TestCase[],
  ): Promise<RunResult>;
  validateSolution(code: string, expectedOutput: string): Promise<boolean>;
}

export interface SkillScore {
  name: string;
  value: number; // 0–100
}

export interface SkillsService {
  getSkills(userId: string): Promise<SkillScore[]>;
}

export interface AvatarService {
  /** Upload avatar for a user. Returns the public URL. */
  uploadAvatar(
    userId: string,
    file: File,
  ): Promise<{ avatarUrl: string }>;
  /** Delete avatar for a user, reverting to default. */
  deleteAvatar(userId: string): Promise<void>;
}

export interface NewsletterService {
  /** Subscribe an email to the newsletter. Returns whether the email was already subscribed. */
  subscribe(
    email: string,
    locale?: string,
  ): Promise<{ alreadySubscribed: boolean }>;
}

// ---------------------------------------------------------------------------
// On-Chain Progress (backend signer)
// ---------------------------------------------------------------------------

export interface LessonCompletionResult {
  confirmed: boolean;
  xpEarned: number | undefined;
  signature: string | undefined;
  /** True when the backend also called finalize_course in the same request. */
  finalized: boolean;
  /** Raw error message from the backend signer, when confirmed = false. */
  backendError?: string;
}

export interface CredentialIssuanceResult {
  confirmed: boolean;
  signature: string | undefined;
  credentialAsset: string | undefined;
}

export interface OnChainProgressService {
  /**
   * Calls complete_lesson on-chain via the backend signer.
   * The backend auto-calls finalize_course when all lessons are complete.
   */
  completeLesson(params: {
    courseId: string;
    lessonIndex: number;
    learnerWallet: string;
    userId: string;
  }): Promise<LessonCompletionResult>;

  /** Calls finalize_course on-chain via the backend signer. */
  finalizeCourse(params: {
    courseId: string;
    learnerWallet: string;
    userId: string;
  }): Promise<{ confirmed: boolean; signature: string | undefined }>;

  /** Calls issue_credential on-chain via the backend signer. */
  issueCredential(params: {
    courseId: string;
    learnerWallet: string;
    userId: string;
    credentialName: string;
    metadataUri: string;
    coursesCompleted: number;
    totalXp: number;
  }): Promise<CredentialIssuanceResult>;
}

// ---------------------------------------------------------------------------
// Track Services
// ---------------------------------------------------------------------------

import type { Track, CourseCardData } from "@/types/course";

export interface TrackService {
  getTracks(): Promise<Track[]>;
  getTrackBySlug(slug: string): Promise<Track | null>;
  getTrackCourses(trackSlug: string): Promise<CourseCardData[]>;
  getTrackProgress(trackSlug: string, enrollments: Enrollment[]): number;
}

export interface TrackImageService {
  getImageUrl(trackSlug: string): string;
  uploadImage(trackSlug: string, file: File): Promise<string>;
}

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------

export interface Testimonial {
  id: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  role: string | null;
  quote: string;
  featured: boolean;
  featuredOrder: number;
  createdAt: string;
}

export interface TestimonialService {
  getFeatured(): Promise<Testimonial[]>;
  getAll(params: { sort?: "newest" | "oldest" }): Promise<Testimonial[]>;
  submit(userId: string, data: { quote: string; role?: string }): Promise<void>;
  setFeatured(id: string, featured: boolean, order?: number): Promise<void>;
}

// ---------------------------------------------------------------------------
// Community (extended)
// ---------------------------------------------------------------------------

export type PostType = "question" | "discussion" | "post";

export interface CommunityPost {
  id: string;
  author: string;
  authorUsername: string | null;
  authorAvatarUrl: string | null;
  title: string;
  content: string;
  courseId: string | null;
  type: PostType;
  tags: string[];
  upvotes: number;
  replies: number;
  liked: boolean;
  createdAt: string;
}

export interface GetPostsParams {
  search?: string;
  courseId?: string;
  userId?: string;
  sort?: "newest" | "oldest" | "popular";
  type?: PostType;
  tag?: string;
  page?: number;
  limit?: number;
}

export interface PostLiker {
  userId: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
}

export interface CommunityService {
  getPosts(params: GetPostsParams): Promise<{ posts: CommunityPost[]; total: number }>;
  getPost(id: string, userId?: string): Promise<CommunityPost | null>;
  getReplies(postId: string, userId?: string): Promise<CommunityPost[]>;
  createPost(userId: string, data: { title: string; content: string; courseId?: string; parentId?: string; type?: PostType; tags?: string[] }): Promise<void>;
  toggleLike(userId: string, postId: string): Promise<{ liked: boolean; upvotes: number }>;
  getLikers(postId: string): Promise<PostLiker[]>;
  getDistinctTags(): Promise<string[]>;
}

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------

export interface CourseRecommendation {
  title: string;
  slug: string;
  difficulty: string;
  trackName: string;
  totalXP: number;
  badge: string;
}

export interface OnboardingService {
  getRecommendations(params: {
    experienceLevel: string;
    web3Level: string;
    interest: string;
  }): Promise<CourseRecommendation[]>;
  isOnboarded(userId: string): Promise<boolean>;
  completeOnboarding(userId: string): Promise<void>;
}

export interface TrackAdminService {
  createTrack(data: {
    name: string;
    slug: string;
    description: string;
    color: string;
    trackId: number;
  }): Promise<Track>;
  updateTrack(slug: string, data: Partial<Track>): Promise<Track>;
  createCollection(trackSlug: string): Promise<{ collectionAddress: string }>;
  uploadCredentialImage(
    trackSlug: string,
    file: File,
  ): Promise<{ imageUrl: string }>;
}

