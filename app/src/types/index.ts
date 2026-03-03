/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Course {
    id: string;
    slug: string;
    courseId: string;
    title: string;
    description: string;
    longDescription: string;
    thumbnail: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    duration: number;
    lessonCount: number;
    xpPerLesson: number;
    xpReward: number;
    track: string;
    trackColor: string;
    instructor: {
        name: string;
        avatar: string;
        title: string;
    };
    prerequisites: string[];
    tags: string[];
    modules: Module[];
    objectives: string[];
    enrolledCount: number;
    rating: number;
    isActive: boolean;
    createdAt: string;
}

export interface Module {
    id: string;
    title: string;
    description: string;
    lessons: Lesson[];
}

export interface Lesson {
    id: string;
    title: string;
    description: string;
    type: "content" | "challenge";
    duration: number;
    xpReward: number;
    content?: string;
    challenge?: Challenge;
    order: number;
}

export interface Challenge {
    prompt: string;
    objectives: string[];
    starterCode: string;
    language: "rust" | "typescript" | "json";
    testCases: TestCase[];
    hints: string[];
    solution: string;
    expectedOutput?: string;
}

export interface TestCase {
    id: string;
    name: string;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
}

export interface UserProfile {
    id: string;
    username: string;
    displayName: string;
    bio: string;
    avatar: string;
    walletAddress?: string;
    email?: string;
    githubUsername?: string;
    googleId?: string;
    socialLinks: {
        twitter?: string;
        github?: string;
        discord?: string;
        website?: string;
    };
    xp: number;
    level: number;
    rank: number;
    streak: StreakData;
    achievements: Achievement[];
    completedCourses: string[];
    enrolledCourses: string[];
    credentials: Credential[];
    skills: SkillData[];
    joinedAt: string;
    isPublic: boolean;
    preferredLanguage: string;
    theme: "dark" | "light" | "system";
}

export interface StreakData {
    current: number;
    longest: number;
    lastActivityDate: string;
    history: Record<string, boolean>;
    freezesAvailable: number;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: "progress" | "streak" | "skill" | "community" | "special";
    xpReward: number;
    unlockedAt?: string;
    isUnlocked: boolean;
    nftMint?: string;
}

export interface Credential {
    id: string;
    trackId: string;
    trackName: string;
    name: string;
    metadataUri: string;
    coursesCompleted: number;
    totalXP: number;
    mintAddress: string;
    owner: string;
    issuedAt: string;
    level: number;
    imageUrl: string;
}

export interface SkillData {
    name: string;
    level: number;
    maxLevel: number;
    color: string;
}

export interface LeaderboardEntry {
    rank: number;
    walletAddress: string;
    username: string;
    displayName: string;
    avatar: string;
    xp: number;
    level: number;
    streak: number;
    coursesCompleted: number;
    isCurrentUser?: boolean;
}

export interface Enrollment {
    courseId: string;
    lessonFlags: number[];
    completedLessons: number;
    totalLessons: number;
    enrolledAt: string;
    completedAt?: string;
    credentialAsset?: string;
    progress: number;
}

export interface ActivityItem {
    id: string;
    type: "lesson_complete" | "course_complete" | "achievement" | "enrollment" | "streak" | "level_up";
    title: string;
    description: string;
    xpEarned: number;
    timestamp: string;
    courseId?: string;
    courseName?: string;
    icon: string;
}

export interface CourseProgress {
    courseId: string;
    courseSlug: string;
    courseTitle: string;
    courseThumbnail: string;
    completedLessons: number;
    totalLessons: number;
    progress: number;
    xpEarned: number;
    nextLessonId?: string;
    nextLessonTitle?: string;
}
