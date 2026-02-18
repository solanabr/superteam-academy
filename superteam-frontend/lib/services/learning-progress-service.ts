import type { Course } from "@/lib/course-catalog";
import { courses as localCourses } from "@/lib/course-catalog";
import type { LeaderboardEntry } from "@/lib/server/leaderboard-cache";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CourseProgress = {
  courseSlug: string;
  completedLessons: string[];
  totalLessons: number;
  progressPercent: number;
  enrolledAt: string | null;
  completedAt: string | null;
};

export type StreakData = {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  streakFreezes: number;
};

export type Credential = {
  id: string;
  courseTitle: string;
  trackName: string;
  level: number;
  mintAddress: string;
  completionDate: string;
  imageUrl: string;
};

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface LearningProgressService {
  getProgressForCourse(
    userId: string,
    courseSlug: string,
  ): Promise<CourseProgress>;
  getAllProgress(userId: string): Promise<CourseProgress[]>;
  completeLesson(
    userId: string,
    courseSlug: string,
    lessonId: string,
  ): Promise<void>;

  getXpBalance(userId: string): Promise<number>;
  getLevel(userId: string): Promise<number>;

  getStreakData(userId: string): Promise<StreakData>;

  getLeaderboard(
    timeframe: "weekly" | "monthly" | "all-time",
    limit?: number,
  ): Promise<LeaderboardEntry[]>;
  getRank(userId: string): Promise<number | null>;

  getCredentials(walletAddress: string): Promise<Credential[]>;
  getCredentialById(id: string): Promise<Credential | null>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const XP_PER_LESSON = 50;
const XP_PER_LEVEL = 500;
const LOCAL_STORAGE_KEY = "superteam-academy-progress";

function countTotalLessons(course: Course): number {
  return course.modules.reduce((acc, mod) => acc + mod.lessons.length, 0);
}

function allLessonIds(course: Course): string[] {
  return course.modules.flatMap((mod) => mod.lessons.map((l) => l.id));
}

function findCourse(slug: string): Course | undefined {
  return localCourses.find((c) => c.slug === slug);
}

function toDateKey(d: Date): string {
  return d.toISOString().split("T")[0]!;
}

// ---------------------------------------------------------------------------
// On-chain implementation (server-side)
// ---------------------------------------------------------------------------

export class OnChainLearningProgressService implements LearningProgressService {
  async getProgressForCourse(
    userId: string,
    courseSlug: string,
  ): Promise<CourseProgress> {
    const { getCourseProgressSnapshot } =
      await import("@/lib/server/academy-progress-adapter");
    const { getCourse } = await import("@/lib/server/admin-store");
    const snapshot = await getCourseProgressSnapshot(userId, courseSlug);
    const course = getCourse(courseSlug);
    const total = course ? countTotalLessons(course) : 0;

    if (!snapshot) {
      return {
        courseSlug,
        completedLessons: [],
        totalLessons: total,
        progressPercent: 0,
        enrolledAt: null,
        completedAt: null,
      };
    }

    const ids = course ? allLessonIds(course) : [];
    const completed = ids.slice(0, snapshot.completedLessons);

    return {
      courseSlug,
      completedLessons: completed,
      totalLessons: total,
      progressPercent: snapshot.course.progress,
      enrolledAt: snapshot.enrolledOnChain ? new Date().toISOString() : null,
      completedAt:
        snapshot.completedLessons >= total && total > 0
          ? new Date().toISOString()
          : null,
    };
  }

  async getAllProgress(userId: string): Promise<CourseProgress[]> {
    const { getAllCourses } = await import("@/lib/server/admin-store");
    const results: CourseProgress[] = [];
    for (const course of getAllCourses()) {
      const progress = await this.getProgressForCourse(userId, course.slug);
      results.push(progress);
    }
    return results;
  }

  async completeLesson(
    userId: string,
    courseSlug: string,
    _lessonId: string,
  ): Promise<void> {
    const { PublicKey } = await import("@solana/web3.js");
    const { completeLessonOnChain } =
      await import("@/lib/server/academy-program");
    const { recordLessonComplete } =
      await import("@/lib/server/activity-store");
    const { getCourse } = await import("@/lib/server/admin-store");

    const user = new PublicKey(userId);
    await completeLessonOnChain(user, courseSlug);

    const course = getCourse(courseSlug);
    recordLessonComplete(userId, course?.title ?? courseSlug);
  }

  async getXpBalance(userId: string): Promise<number> {
    const { getLearnerProfileOnChain } =
      await import("@/lib/server/academy-chain-read");
    const profile = await getLearnerProfileOnChain(userId);
    return profile?.xpTotal ?? 0;
  }

  async getLevel(userId: string): Promise<number> {
    const { getLearnerProfileOnChain } =
      await import("@/lib/server/academy-chain-read");
    const profile = await getLearnerProfileOnChain(userId);
    return profile?.level ?? 1;
  }

  async getStreakData(userId: string): Promise<StreakData> {
    const { getActivityData, computeStreakFromDays } =
      await import("@/lib/server/activity-store");
    const { getLearnerProfileOnChain } =
      await import("@/lib/server/academy-chain-read");

    const [activityData, profile] = await Promise.all([
      getActivityData(userId),
      getLearnerProfileOnChain(userId),
    ]);

    const currentStreak = computeStreakFromDays(activityData.days);

    const lastDay = [...activityData.days].reverse().find((d) => d.count > 0);

    return {
      currentStreak,
      longestStreak: profile?.streakLongest ?? currentStreak,
      lastActivityDate: lastDay?.date ?? null,
      streakFreezes: 0,
    };
  }

  async getLeaderboard(
    _timeframe: "weekly" | "monthly" | "all-time",
    limit?: number,
  ): Promise<LeaderboardEntry[]> {
    const { getCachedLeaderboard } =
      await import("@/lib/server/leaderboard-cache");
    const entries = await getCachedLeaderboard();
    return limit ? entries.slice(0, limit) : entries;
  }

  async getRank(userId: string): Promise<number | null> {
    const { getCachedLeaderboard, getRankForWallet } =
      await import("@/lib/server/leaderboard-cache");
    const entries = await getCachedLeaderboard();
    return getRankForWallet(entries, userId);
  }

  async getCredentials(walletAddress: string): Promise<Credential[]> {
    const { getCredentialNFTs } =
      await import("@/lib/server/academy-chain-read");

    const nfts = await getCredentialNFTs(walletAddress);
    if (nfts.length > 0) {
      return nfts.map((nft) => ({
        id: nft.id,
        courseTitle: nft.name,
        trackName: nft.trackName,
        level: nft.level,
        mintAddress: nft.mintAddress,
        completionDate: nft.completionDate,
        imageUrl: nft.imageUrl,
      }));
    }

    // Fallback: derive credentials from completed enrollments
    const { getCertificatesForWallet } =
      await import("@/lib/server/certificate-service");
    const certs = await getCertificatesForWallet(walletAddress);
    return certs.map((c) => ({
      id: c.id,
      courseTitle: c.courseTitle,
      trackName: c.trackName,
      level: parseInt(c.trackLevel, 10) || 1,
      mintAddress: c.mintAddress,
      completionDate: c.completionDate,
      imageUrl: "",
    }));
  }

  async getCredentialById(id: string): Promise<Credential | null> {
    const { getCertificateById } =
      await import("@/lib/server/certificate-service");
    const cert = getCertificateById(id);
    if (!cert) return null;
    return {
      id: cert.id,
      courseTitle: cert.courseTitle,
      trackName: cert.trackName,
      level: parseInt(cert.trackLevel, 10) || 1,
      mintAddress: cert.mintAddress,
      completionDate: cert.completionDate,
      imageUrl: "",
    };
  }
}

// ---------------------------------------------------------------------------
// Local implementation (client-side, localStorage-backed)
// ---------------------------------------------------------------------------

type LocalProgressStore = {
  courses: Record<
    string,
    {
      completedLessons: string[];
      enrolledAt: string | null;
      completedAt: string | null;
    }
  >;
  activityDates: string[];
  longestStreak: number;
};

function loadStore(): LocalProgressStore {
  if (typeof window === "undefined") {
    return { courses: {}, activityDates: [], longestStreak: 0 };
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return { courses: {}, activityDates: [], longestStreak: 0 };
    return JSON.parse(raw) as LocalProgressStore;
  } catch {
    return { courses: {}, activityDates: [], longestStreak: 0 };
  }
}

function saveStore(store: LocalProgressStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(store));
}

function computeLocalStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const unique = [...new Set(dates)].sort().reverse();
  const today = toDateKey(new Date());
  const yesterday = toDateKey(new Date(Date.now() - 86_400_000));

  if (unique[0] !== today && unique[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1]!);
    const curr = new Date(unique[i]!);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86_400_000);
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export class LocalLearningProgressService implements LearningProgressService {
  async getProgressForCourse(
    _userId: string,
    courseSlug: string,
  ): Promise<CourseProgress> {
    const store = loadStore();
    const courseData = store.courses[courseSlug];
    const course = findCourse(courseSlug);
    const total = course ? countTotalLessons(course) : 0;

    if (!courseData) {
      return {
        courseSlug,
        completedLessons: [],
        totalLessons: total,
        progressPercent: 0,
        enrolledAt: null,
        completedAt: null,
      };
    }

    const completedCount = courseData.completedLessons.length;
    const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    return {
      courseSlug,
      completedLessons: courseData.completedLessons,
      totalLessons: total,
      progressPercent: percent,
      enrolledAt: courseData.enrolledAt,
      completedAt: courseData.completedAt,
    };
  }

  async getAllProgress(_userId: string): Promise<CourseProgress[]> {
    return Promise.all(
      localCourses.map((c) => this.getProgressForCourse("", c.slug)),
    );
  }

  async completeLesson(
    _userId: string,
    courseSlug: string,
    lessonId: string,
  ): Promise<void> {
    const store = loadStore();

    if (!store.courses[courseSlug]) {
      store.courses[courseSlug] = {
        completedLessons: [],
        enrolledAt: new Date().toISOString(),
        completedAt: null,
      };
    }

    const courseData = store.courses[courseSlug]!;
    if (!courseData.completedLessons.includes(lessonId)) {
      courseData.completedLessons.push(lessonId);
    }

    const course = findCourse(courseSlug);
    if (course) {
      const total = countTotalLessons(course);
      if (
        courseData.completedLessons.length >= total &&
        !courseData.completedAt
      ) {
        courseData.completedAt = new Date().toISOString();
      }
    }

    store.activityDates.push(toDateKey(new Date()));

    const currentStreak = computeLocalStreak(store.activityDates);
    if (currentStreak > store.longestStreak) {
      store.longestStreak = currentStreak;
    }

    saveStore(store);
  }

  async getXpBalance(_userId: string): Promise<number> {
    const store = loadStore();
    let total = 0;
    for (const courseData of Object.values(store.courses)) {
      total += courseData.completedLessons.length * XP_PER_LESSON;
    }
    return total;
  }

  async getLevel(_userId: string): Promise<number> {
    const xp = await this.getXpBalance("");
    return Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1);
  }

  async getStreakData(_userId: string): Promise<StreakData> {
    const store = loadStore();
    const currentStreak = computeLocalStreak(store.activityDates);
    const sorted = [...new Set(store.activityDates)].sort().reverse();

    return {
      currentStreak,
      longestStreak: Math.max(store.longestStreak, currentStreak),
      lastActivityDate: sorted[0] ?? null,
      streakFreezes: 0,
    };
  }

  async getLeaderboard(
    _timeframe: "weekly" | "monthly" | "all-time",
    _limit?: number,
  ): Promise<LeaderboardEntry[]> {
    return [];
  }

  async getRank(_userId: string): Promise<number | null> {
    return null;
  }

  async getCredentials(_walletAddress: string): Promise<Credential[]> {
    return [];
  }

  async getCredentialById(_id: string): Promise<Credential | null> {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function getLearningProgressService(
  mode: "onchain" | "local",
): LearningProgressService {
  if (mode === "onchain") {
    return new OnChainLearningProgressService();
  }
  return new LocalLearningProgressService();
}
