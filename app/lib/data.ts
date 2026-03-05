import type {
    UserProfile,
    LeaderboardEntry,
    Credential,
    UserSettings,
} from "./types";

// ============================================
// Mock User Profile (will be replaced with on-chain data)
// ============================================

export const mockCurrentUser: UserProfile = {
    username: "learner",
    displayName: "Learner",
    avatar: "",
    bio: "",
    joinDate: new Date().toISOString(),
    xp: 0,
    level: 0,
    streak: 0,
    longestStreak: 0,
    coursesCompleted: 0,
    challengesSolved: 0,
    rank: 0,
    skills: [],
    achievements: [],
    completedCourses: [],
    credentials: [],
    socialLinks: {},
    isPublic: true,
};

// ============================================
// Leaderboard (will be replaced with on-chain data)
// ============================================

export const mockLeaderboard: LeaderboardEntry[] = [];

// ============================================
// Settings (will be replaced with user preferences storage)
// ============================================

export const mockSettings: UserSettings = {
    profile: {
        displayName: "",
        bio: "",
        avatar: "",
        isPublic: true,
    },
    linkedAccounts: {},
    preferences: {
        language: "en",
        theme: "dark",
        emailNotifications: true,
        achievementNotifications: true,
        weeklyDigest: false,
    },
    privacy: {
        showProfile: true,
        showProgress: true,
        showAchievements: true,
        showOnLeaderboard: true,
    },
};

// ============================================
// Service Abstractions (non-course, kept for pages that still need them)
// ============================================

export async function getCurrentUser(): Promise<UserProfile> {
    return mockCurrentUser;
}

export async function getUserByUsername(username: string): Promise<UserProfile | null> {
    if (username === mockCurrentUser.username) return mockCurrentUser;
    return null;
}

export async function getLeaderboard(_period: "weekly" | "monthly" | "all-time"): Promise<LeaderboardEntry[]> {
    return mockLeaderboard;
}

export async function getCredentialById(id: string): Promise<Credential | null> {
    return mockCurrentUser.credentials.find((c) => c.id === id) ?? null;
}

export async function getUserSettings(): Promise<UserSettings> {
    return mockSettings;
}
