import { fetchWithAuth } from "./api";

export interface DashboardCourse {
    courseId: string;
    slug: string;
    title: string;
    thumbnail?: string;
    difficulty: string;
    topic: string;
    totalXP: number;
    completedAt: string | null;
    lastAccessedAt: string;
    progress: {
        completed: number;
        total: number;
        percent: number;
        milestonesCompleted?: number;
        milestonesTotal?: number;
    };
}

export interface RecentActivity {
    type: string;
    courseId: {
        _id: string;
        title: string;
        slug: string;
    };
    milestoneOrder: number;
    at: string;
}

export interface DashboardData {
    xp: {
        total: number;
        locked: number;
        level: number;
        totalXP?: number;
        currentLevelXP?: number;
        nextLevelXP: number;
        progressXP?: number;
        rangeXP?: number;
        progressPercent: number;
    };
    streak: {
        current: number;
        longest: number;
        lastActive: string | null;
        activityDates: string[];
    };
    activeCourses: DashboardCourse[];
    recommendedCourses: any[]; // Similar structure to DashboardCourse
    recentActivity: RecentActivity[];
}

export interface DashboardResponse {
    success: boolean;
    data: DashboardData;
}

export const dashboardApi = {
    /**
     * Get user dashboard data
     */
    async getDashboardData(): Promise<DashboardResponse> {
        return fetchWithAuth<DashboardResponse>("/dashboard", { method: "GET" });
    }
};
