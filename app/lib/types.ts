// ============================================
// Core domain types for Superteam Academy
// ============================================

export type Difficulty = "beginner" | "intermediate" | "advanced" | "expert";

export interface Course {
    id: string;
    slug: string;
    title: string;
    description: string;
    shortDescription: string;
    difficulty: Difficulty;
    track: string;
    duration: string;
    lessonCount: number;
    xpReward: number;
    enrolled: number;
    rating: number;
    tags: string[];
    modules: Module[];
    outcomes: string[];
    prerequisites: string[];
    instructor: Instructor;
    reviews: Review[];
    imageUrl?: string;
    progress?: number; // 0-100, undefined = not enrolled
}

export interface Module {
    id: string;
    title: string;
    description: string;
    lessons: Lesson[];
    isCompleted?: boolean;
}

export interface QuizQuestion {
    question: string;
    options: string[];
    correctOptionIndex: number;
    explanation?: string;
}

export interface Quiz {
    isRequired: boolean;
    timerSeconds?: number;
    xpReward?: number;
    questions: QuizQuestion[];
}

export interface Lesson {
    id: string; // the slug value
    title: string;
    type: "reading" | "code" | "quiz" | "video" | "game";
    duration: string;
    xp: number;
    isCompleted?: boolean;
    isLocked?: boolean;
    content?: string;
    // Code Challenge Fields
    language?: string;
    initialCode?: string;
    solutionCode?: string;
    testCases?: string[];
    hints?: string[];
    // Interactive Quiz Fields
    quiz?: Quiz;
}

export interface Instructor {
    name: string;
    avatar: string;
    title: string;
    bio: string;
}

export interface Review {
    author: string;
    avatar: string;
    rating: number;
    comment: string;
    date: string;
}

export interface UserProfile {
    username: string;
    displayName: string;
    avatar: string;
    bio: string;
    joinDate: string;
    xp: number;
    level: number;
    streak: number;
    longestStreak: number;
    coursesCompleted: number;
    challengesSolved: number;
    rank: number;
    skills: Skill[];
    achievements: Achievement[];
    completedCourses: CompletedCourse[];
    credentials: Credential[];
    socialLinks: SocialLinks;
    isPublic: boolean;
    walletAddress?: string;
}

export interface Skill {
    name: string;
    level: number; // 0-100
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    earnedDate?: string;
    rarity: "common" | "rare" | "epic" | "legendary";
}

export interface CompletedCourse {
    courseId: string;
    courseTitle: string;
    completedDate: string;
    grade: string;
    xpEarned: number;
}

export interface Credential {
    id: string;
    courseTitle: string;
    coursePath: string;
    issueDate: string;
    recipientName: string;
    recipientWallet: string;
    txSignature: string;
    mintAddress: string;
    metadata: CredentialMetadata;
}

export interface CredentialMetadata {
    name: string;
    description: string;
    image: string;
    attributes: { trait_type: string; value: string }[];
}

export interface LeaderboardEntry {
    rank: number;
    username: string;
    displayName: string;
    avatar: string;
    xp: number;
    level: number;
    streak: number;
    coursesCompleted: number;
    isCurrentUser?: boolean;
}

export interface SocialLinks {
    github?: string;
    twitter?: string;
    discord?: string;
    website?: string;
}

export interface DashboardData {
    profile: UserProfile;
    activeCourses: Course[];
    recentActivity: ActivityItem[];
    recommendations: Course[];
}

export interface ActivityItem {
    id: string;
    type: "lesson_completed" | "challenge_solved" | "course_completed" | "achievement_earned" | "streak_milestone";
    title: string;
    description: string;
    xpEarned: number;
    timestamp: string;
}

export interface UserSettings {
    profile: {
        displayName: string;
        bio: string;
        avatar: string;
        isPublic: boolean;
    };
    linkedAccounts: {
        wallet?: string;
        github?: string;
        google?: string;
    };
    preferences: {
        language: string;
        theme: string;
        emailNotifications: boolean;
        achievementNotifications: boolean;
        weeklyDigest: boolean;
    };
    privacy: {
        showProfile: boolean;
        showProgress: boolean;
        showAchievements: boolean;
        showOnLeaderboard: boolean;
    };
}
