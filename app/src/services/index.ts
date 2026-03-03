import type {
    Course,
    UserProfile,
    Enrollment,
    LeaderboardEntry,
    Achievement,
    Credential,
    CourseProgress,
    StreakData,
    ActivityItem,
} from "@/types";
import {
    MOCK_COURSES,
    MOCK_USER,
    MOCK_LEADERBOARD,
    MOCK_ACHIEVEMENTS,
    MOCK_COURSE_PROGRESS,
    MOCK_ACTIVITY,
} from "@/lib/mock-data";

// ────────────────────────────────────────────────────────────────
// LearningProgressService
// Clean service interface for frontend ↔ on-chain integration.
// Currently backed by localStorage/mock data. Swap implementations
// to connect to the real on-chain program later.
// ────────────────────────────────────────────────────────────────

const STORAGE_PREFIX = "superteam_academy_";

function getStorage<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
        const item = localStorage.getItem(STORAGE_PREFIX + key);
        return item ? JSON.parse(item) : fallback;
    } catch {
        return fallback;
    }
}

function setStorage<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
}

// ── Course Service ────────────────────────────────────────────

export const CourseService = {
    getAllCourses(): Course[] {
        return MOCK_COURSES;
    },

    getCourseBySlug(slug: string): Course | undefined {
        return MOCK_COURSES.find((c) => c.slug === slug);
    },

    getCourseById(id: string): Course | undefined {
        return MOCK_COURSES.find((c) => c.id === id || c.courseId === id);
    },

    searchCourses(query: string): Course[] {
        const q = query.toLowerCase();
        return MOCK_COURSES.filter(
            (c) =>
                c.title.toLowerCase().includes(q) ||
                c.description.toLowerCase().includes(q) ||
                c.tags.some((t) => t.toLowerCase().includes(q))
        );
    },

    filterCourses(params: {
        difficulty?: string;
        track?: string;
        search?: string;
    }): Course[] {
        let courses = MOCK_COURSES;
        if (params.difficulty && params.difficulty !== "all") {
            courses = courses.filter((c) => c.difficulty === params.difficulty);
        }
        if (params.track) {
            courses = courses.filter((c) =>
                c.track.toLowerCase().includes(params.track!.toLowerCase())
            );
        }
        if (params.search) {
            const q = params.search.toLowerCase();
            courses = courses.filter(
                (c) =>
                    c.title.toLowerCase().includes(q) ||
                    c.description.toLowerCase().includes(q)
            );
        }
        return courses;
    },
};

// ── Learning Progress Service ─────────────────────────────────

export const LearningProgressService = {
    getProgressForCourse(
        _walletAddress: string,
        courseId: string
    ): Enrollment | null {
        const enrollments = getStorage<Record<string, Enrollment>>(
            "enrollments",
            {}
        );
        return enrollments[courseId] || null;
    },

    getAllProgress(_walletAddress: string): CourseProgress[] {
        return MOCK_COURSE_PROGRESS;
    },

    async enrollInCourse(
        _walletAddress: string,
        courseId: string
    ): Promise<boolean> {
        const course = CourseService.getCourseById(courseId);
        if (!course) return false;

        const enrollments = getStorage<Record<string, Enrollment>>(
            "enrollments",
            {}
        );
        if (enrollments[courseId]) return true;

        enrollments[courseId] = {
            courseId,
            lessonFlags: [0, 0, 0, 0],
            completedLessons: 0,
            totalLessons: course.lessonCount,
            enrolledAt: new Date().toISOString(),
            progress: 0,
        };
        setStorage("enrollments", enrollments);
        return true;
    },

    async completeLesson(
        _walletAddress: string,
        courseId: string,
        lessonIndex: number
    ): Promise<{ success: boolean; xpEarned: number }> {
        // STUB: In production, backend signs this transaction
        const enrollments = getStorage<Record<string, Enrollment>>(
            "enrollments",
            {}
        );
        const enrollment = enrollments[courseId];
        if (!enrollment) return { success: false, xpEarned: 0 };

        const wordIndex = Math.floor(lessonIndex / 64);
        const bitIndex = lessonIndex % 64;
        enrollment.lessonFlags[wordIndex] |= 1 << bitIndex;

        let completed = 0;
        for (let i = 0; i < enrollment.totalLessons; i++) {
            const wi = Math.floor(i / 64);
            const bi = i % 64;
            if (enrollment.lessonFlags[wi] & (1 << bi)) completed++;
        }
        enrollment.completedLessons = completed;
        enrollment.progress = (completed / enrollment.totalLessons) * 100;

        if (completed === enrollment.totalLessons) {
            enrollment.completedAt = new Date().toISOString();
        }

        enrollments[courseId] = enrollment;
        setStorage("enrollments", enrollments);

        const course = CourseService.getCourseById(courseId);
        const xpEarned = course?.xpPerLesson || 25;

        // Update XP locally
        const currentXP = getStorage<number>("xp", MOCK_USER.xp);
        setStorage("xp", currentXP + xpEarned);

        return { success: true, xpEarned };
    },

    getXPBalance(_walletAddress: string): number {
        return getStorage<number>("xp", MOCK_USER.xp);
    },

    getStreakData(): StreakData {
        const stored = getStorage<StreakData | null>("streak", null);
        if (stored) return stored;
        return MOCK_USER.streak;
    },

    updateStreak(): StreakData {
        const streak = this.getStreakData();
        const today = new Date().toISOString().split("T")[0];

        if (streak.history[today]) return streak;

        streak.history[today] = true;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = yesterday.toISOString().split("T")[0];

        if (streak.history[yesterdayKey]) {
            streak.current += 1;
        } else {
            streak.current = 1;
        }

        if (streak.current > streak.longest) {
            streak.longest = streak.current;
        }

        streak.lastActivityDate = new Date().toISOString();
        setStorage("streak", streak);
        return streak;
    },
};

// ── Leaderboard Service ───────────────────────────────────────

export const LeaderboardService = {
    getLeaderboard(
        timeframe: "weekly" | "monthly" | "allTime" = "allTime"
    ): LeaderboardEntry[] {
        // STUB: In production, index XP token balances via Helius DAS API
        const entries = [...MOCK_LEADERBOARD];
        if (timeframe === "weekly") {
            return entries.map((e) => ({
                ...e,
                xp: Math.floor(e.xp * 0.1),
            }));
        }
        if (timeframe === "monthly") {
            return entries.map((e) => ({
                ...e,
                xp: Math.floor(e.xp * 0.35),
            }));
        }
        return entries;
    },
};

// ── Achievement Service ───────────────────────────────────────

export const AchievementService = {
    getAllAchievements(): Achievement[] {
        return MOCK_ACHIEVEMENTS;
    },

    getUnlockedAchievements(): Achievement[] {
        return MOCK_ACHIEVEMENTS.filter((a) => a.isUnlocked);
    },

    async claimAchievement(
        _achievementId: string
    ): Promise<{ success: boolean; xpEarned: number }> {
        // STUB: In production, minter calls award_achievement on-chain
        return { success: true, xpEarned: 100 };
    },
};

// ── Credential Service ────────────────────────────────────────

export const CredentialService = {
    getCredentials(_walletAddress: string): Credential[] {
        return MOCK_USER.credentials;
    },

    getCredentialById(id: string): Credential | undefined {
        return MOCK_USER.credentials.find((c) => c.id === id);
    },

    async verifyCredential(
        _mintAddress: string
    ): Promise<{ valid: boolean; owner: string }> {
        // STUB: In production, verify via Helius DAS API
        return { valid: true, owner: MOCK_USER.walletAddress || "" };
    },
};

// ── User Service ──────────────────────────────────────────────

export const UserService = {
    getProfile(): UserProfile {
        const xp = getStorage<number>("xp", MOCK_USER.xp);
        const streak = LearningProgressService.getStreakData();
        return {
            ...MOCK_USER,
            xp,
            level: Math.floor(Math.sqrt(xp / 100)),
            streak,
        };
    },

    updateProfile(updates: Partial<UserProfile>): UserProfile {
        const profile = this.getProfile();
        const updated = { ...profile, ...updates };
        setStorage("profile", updated);
        return updated;
    },

    getActivity(): ActivityItem[] {
        return MOCK_ACTIVITY;
    },
};
