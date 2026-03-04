import { fetchWithAuth } from "./api";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AdminCourse {
    _id: string;
    title: string;
    slug: string;
    status: "draft" | "published" | "archived";
    difficulty: "beginner" | "intermediate" | "advanced";
    topic: string;
    totalXP: number;
    enrollmentCount: number;
    completionCount: number;
    rating: number;
    ratingCount: number;
    publishedAt?: string;
    createdAt: string;
}

export interface AdminUser {
    _id: string;
    username?: string;
    name?: string;
    email?: string;
    avatar?: string;
    role: "user" | "admin";
    isBanned: boolean;
    totalXP: number;
    level: number;
    currentStreak: number;
    lastActive?: string;
    createdAt: string;
}

export interface AdminUserDetail {
    user: AdminUser & {
        bio?: string;
        twitter?: string;
        github?: string;
        discord?: string;
        website?: string;
        longestStreak?: number;
        isPublic?: boolean;
    };
    enrollments: Array<{
        _id: string;
        courseId: { title: string; slug: string; difficulty: string };
        createdAt: string;
        completedAt?: string;
    }>;
    achievements: Array<{
        _id: string;
        achievementKey: string;
        awardedAt: string;
        txSignature?: string;
    }>;
}

export interface AnalyticsOverview {
    users: { total: number; activeToday: number; activeThisWeek: number };
    enrollments: { total: number; completed: number };
    xpDistributed: number;
    community: { threads: number; replies: number };
}

export interface AnalyticsCourse {
    _id: string;
    title: string;
    slug: string;
    status: string;
    difficulty: string;
    totalXP: number;
    enrollmentCount: number;
    completionCount: number;
    completionRate: number;
    rating: number;
    ratingCount: number;
    avgCompletionHours?: number;
}

export interface AnalyticsUsers {
    signupsByDay: Array<{ date: string; count: number }>;
    levelDistribution: Array<{ level: number; count: number }>;
}

export interface AchievementStat {
    key: string;
    name: string;
    category: string;
    mintedCount: number;
    percentOfUsers: number;
    isActive: boolean;
}

export interface AchievementType {
    _id: string;
    key: string;
    name: string;
    description: string;
    category: string;
    imageUrl?: string;
    isActive: boolean;
    mintedCount: number;
    maxSupply?: number;
}

export interface Thread {
    _id: string;
    title: string;
    body: string;
    type: "discussion" | "question";
    authorId: { username?: string; name?: string; avatar?: string } | string;
    tags: string[];
    upvotes: string[];
    replyCount: number;
    isPinned: boolean;
    isLocked: boolean;
    isSolved: boolean;
    createdAt: string;
    isDeleted: boolean;
}

export interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ─── Course Management ──────────────────────────────────────────────────────────

export async function adminGetCourses(params?: {
    status?: string;
    page?: number;
    limit?: number;
}): Promise<{ data: AdminCourse[]; pagination: Pagination }> {
    const q = new URLSearchParams();
    if (params?.status) q.set("status", params.status);
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    return fetchWithAuth(`/admin/courses?${q}`);
}

export async function adminUpdateCourse(
    slug: string,
    body: Partial<Pick<AdminCourse, "title" | "difficulty" | "topic"> & { description: string; shortDescription: string; tags: string[]; author: object; status: string }>
): Promise<{ data: AdminCourse }> {
    return fetchWithAuth(`/admin/courses/${slug}`, {
        method: "PATCH",
        body: JSON.stringify(body),
    });
}

export async function adminArchiveCourse(slug: string): Promise<{ message: string }> {
    return fetchWithAuth(`/admin/courses/${slug}/archive`, { method: "PATCH" });
}

export async function adminDeleteCourse(slug: string): Promise<{ message: string }> {
    return fetchWithAuth(`/admin/courses/${slug}`, { method: "DELETE" });
}

export async function adminCreateCourse(body: Record<string, unknown>): Promise<{ data: AdminCourse }> {
    return fetchWithAuth(`/courses/admin`, {
        method: "POST",
        body: JSON.stringify(body),
    });
}

export async function adminPublishCourse(slug: string): Promise<{ message: string }> {
    return fetchWithAuth(`/courses/admin/${slug}/publish`, { method: "PATCH" });
}

// ─── User Management ────────────────────────────────────────────────────────────

export async function adminGetUsers(params?: {
    search?: string;
    role?: string;
    page?: number;
    limit?: number;
}): Promise<{ data: AdminUser[]; pagination: Pagination }> {
    const q = new URLSearchParams();
    if (params?.search) q.set("search", params.search);
    if (params?.role) q.set("role", params.role);
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    return fetchWithAuth(`/admin/users?${q}`);
}

export async function adminGetUser(id: string): Promise<{ data: AdminUserDetail }> {
    return fetchWithAuth(`/admin/users/${id}`);
}

export async function adminSetRole(id: string, role: "user" | "admin"): Promise<{ data: AdminUser }> {
    return fetchWithAuth(`/admin/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
    });
}

export async function adminBanUser(id: string, banned: boolean): Promise<{ data: AdminUser }> {
    return fetchWithAuth(`/admin/users/${id}/ban`, {
        method: "PATCH",
        body: JSON.stringify({ banned }),
    });
}

// ─── Analytics ──────────────────────────────────────────────────────────────────

export async function analyticsOverview(): Promise<{ data: AnalyticsOverview }> {
    return fetchWithAuth(`/admin/analytics/overview`);
}

export async function analyticsCourses(): Promise<{ data: AnalyticsCourse[] }> {
    return fetchWithAuth(`/admin/analytics/courses`);
}

export async function analyticsUsers(): Promise<{ data: AnalyticsUsers }> {
    return fetchWithAuth(`/admin/analytics/users`);
}

export async function analyticsAchievements(): Promise<{ data: AchievementStat[] }> {
    return fetchWithAuth(`/admin/analytics/achievements`);
}

// ─── Achievements ────────────────────────────────────────────────────────────────

export async function getAchievementTypes(): Promise<{ data: AchievementType[] }> {
    const res = await fetch(`${API}/achievements/types`);
    return res.json();
}

export async function adminAwardAchievement(
    userId: string,
    key: string
): Promise<{ message: string }> {
    return fetchWithAuth(`/achievements/admin/award`, {
        method: "POST",
        body: JSON.stringify({ userId, key }),
    });
}

// ─── Community ──────────────────────────────────────────────────────────────────

export async function adminGetThreads(params?: {
    type?: string;
    sort?: string;
    page?: number;
    limit?: number;
}): Promise<{ data: Thread[]; pagination: Pagination }> {
    const q = new URLSearchParams();
    if (params?.type) q.set("type", params.type);
    if (params?.sort) q.set("sort", params.sort);
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    return fetchWithAuth(`/community/threads?${q}`);
}

export async function adminPinThread(id: string): Promise<{ message: string }> {
    return fetchWithAuth(`/community/threads/${id}/pin`, { method: "PATCH" });
}

export async function adminLockThread(id: string): Promise<{ message: string }> {
    return fetchWithAuth(`/community/threads/${id}/lock`, { method: "PATCH" });
}

export async function adminDeleteThread(id: string): Promise<{ message: string }> {
    return fetchWithAuth(`/community/threads/${id}`, { method: "DELETE" });
}

// ─── Upload ──────────────────────────────────────────────────────────────────────

export async function adminUploadAsset(
    file: File
): Promise<{ success: boolean; url: string; type: "local" | "cloudinary" }> {
    const token = typeof window !== "undefined" ? localStorage.getItem("osmos_token") : null;
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API}/upload/asset`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Upload failed");
    return data;
}

// ─── Sanity CMS Sync ─────────────────────────────────────────────────────────────

export async function adminSyncSanity(): Promise<{
    created: string[];
    updated: string[];
    errors: { slug: string; error: string }[]
}> {
    return fetchWithAuth(`/admin/sync-sanity`, { method: "POST" });
}
