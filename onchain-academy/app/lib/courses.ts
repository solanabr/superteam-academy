import { fetchWithAuth } from "./api";

// ─── Enums & Constants ───

export type Difficulty = "beginner" | "intermediate" | "advanced";
export type CourseStatus = "draft" | "published" | "archived";
export type CourseTopic =
    | "solana-basics"
    | "smart-contracts"
    | "defi"
    | "nfts"
    | "tokens"
    | "web3-frontend"
    | "security"
    | "tooling";

export type LessonType = "video" | "document" | "text" | "doc"; // "doc" kept for legacy mapping
export type TestType = "quiz" | "code_challenge" | "test";

// ─── Interfaces ───

export interface Certificate {
    title: string;
    description: string;
    shortDescription: string;
    completedAt: string;
}

export interface CourseAuthor {
    name: string;
    avatar?: string;
    title?: string;
}

export interface Lesson {
    _id: string;
    title: string;
    type: LessonType;
    content?: string;
    url?: string;
    duration?: number; // In minutes
    order: number;
    completed?: boolean;
}

export interface QuizOption {
    label: string;
    isCorrect: boolean;
}

export interface QuizQuestion {
    _id: string;
    question: string;
    options: QuizOption[];
    explanation?: string;
}

export interface CodeChallenge {
    prompt: string;
    starterCode: string;
    language: "typescript" | "rust" | "javascript";
}

export interface Test {
    _id: string;
    title: string;
    type: TestType;
    passThreshold: number;
    points: number;
    questions?: QuizQuestion[];
    codeChallenge?: CodeChallenge;
    completed?: boolean;
}

export interface Milestone {
    _id: string;
    title: string;
    description: string;
    order: number;
    xpReward: number; // Renamed from xp to match backend
    lessons: Lesson[];
    tests: Test[];
    completed?: boolean;
    allItems?: any[]; // For frontend UI mapping
}

export interface Course {
    _id: string;
    slug: string;
    title: string;
    description: string;
    shortDescription: string;
    thumbnail?: string;
    tags: string[];
    difficulty: Difficulty;
    topic: CourseTopic;
    status: CourseStatus;
    milestones: Milestone[];
    author: CourseAuthor;
    createdAt: string;
    updatedAt: string;

    // Denormalized stats
    totalXP: number;
    duration: number; // Total minutes
    enrollmentCount: number;
    completionCount: number;
    rating: number;
    ratingCount: number;

    // Frontend UI-only properties (for visual metadata mapping)
    level?: string;
    progress?: number;
    playersActive?: number;
    completionRate?: number;
}

export interface PaginatedCourses {
    success: boolean;
    data: Course[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface SingleCourseResponse {
    success: boolean;
    data: {
        course: Course & { milestoneCount: number; lessonCount: number };
        reviews: any[];
        enrollment?: any;
        milestoneProgress?: any[];
    };
}

// ─── API Wrapper ───

export const coursesApi = {
    /**
     * Get all courses, paginated
     */
    async getCourses(params?: { difficulty?: string; topic?: string; search?: string; page?: number; limit?: number }): Promise<PaginatedCourses> {
        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    queryParams.append(key, String(value));
                }
            });
        }
        const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";
        return fetchWithAuth<PaginatedCourses>(`/courses${qs}`, { method: "GET" });
    },

    /**
     * Get a single course by slug
     */
    async getCourseBySlug(slug: string): Promise<SingleCourseResponse> {
        return fetchWithAuth<SingleCourseResponse>(`/courses/${slug}`, { method: "GET" });
    },

    /**
     * Enroll in a course
     */
    async enrollCourse(slug: string): Promise<any> {
        return fetchWithAuth(`/courses/${slug}/enroll`, { method: "POST" });
    },

    /**
     * Complete a test attempt for a milestone
     */
    async completeMilestone(
        slug: string,
        milestoneId: string,
        testId: string,
        payload: { quizAnswers?: any[]; codeResults?: any[] }
    ): Promise<any> {
        return fetchWithAuth(`/courses/${slug}/milestones/${milestoneId}/complete`, {
            method: "POST",
            body: JSON.stringify({ testId, ...payload }),
        });
    },

    /**
     * Mark a lesson as complete
     */
    async completeLesson(slug: string, milestoneId: string, lessonId: string): Promise<any> {
        return fetchWithAuth(`/courses/${slug}/milestones/${milestoneId}/lessons/${lessonId}/complete`, {
            method: "POST",
        });
    },

    /**
     * Claim XP for a completed milestone
     */
    async claimMilestoneXP(slug: string, milestoneId: string): Promise<any> {
        return fetchWithAuth(`/courses/${slug}/milestones/${milestoneId}/claim-xp`, { method: "POST" });
    },

    /**
     * Get certificate details for a completed course
     */
    async getCertificateDetails(slug: string): Promise<{ success: boolean; data: Certificate }> {
        return fetchWithAuth<{ success: boolean; data: Certificate }>(`/courses/${slug}/certificate`, { method: "GET" });
    },

    /**
     * Submit a rating/review
     */
    async rateCourse(slug: string, rating: number, comment?: string): Promise<any> {
        return fetchWithAuth(`/courses/${slug}/rate`, {
            method: "POST",
            body: JSON.stringify({ rating, comment }),
        });
    }
};
