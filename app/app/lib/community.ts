import { fetchWithAuth } from "./api";

/* ─── Types ─── */

export type ThreadType = "discussion" | "question";

export interface ThreadAuthor {
    _id: string;
    username: string;
    name?: string;
    avatar?: string;
    level: number;
}

export interface Thread {
    _id: string;
    title: string;
    body: string; // Markdown
    author: ThreadAuthor;
    type: ThreadType;
    tags: string[];
    courseId?: string;
    milestoneId?: string;
    upvotes: string[]; // User IDs
    views: number;
    isPinned: boolean;
    isLocked: boolean;
    isSolved: boolean;
    acceptedReplyId?: string;
    replyCount: number;
    lastActivityAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface Reply {
    _id: string;
    threadId: string;
    author: ThreadAuthor;
    body: string; // Markdown
    parentReplyId?: string;
    upvotes: string[]; // User IDs
    isAccepted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CommunityFilters {
    type?: ThreadType;
    courseId?: string;
    tag?: string;
    solved?: boolean;
    sort?: "latest" | "top";
    page?: number;
    limit?: number;
}

export interface PaginatedThreads {
    success: boolean;
    data: Thread[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface ThreadDetailResponse {
    success: boolean;
    data: {
        thread: Thread;
        replies: Reply[];
        replyPagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    };
}

/* ─── API Service ─── */

export const communityApi = {
    /**
     * Get a paginated list of threads
     */
    async getThreads(params: CommunityFilters = {}): Promise<PaginatedThreads> {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) query.append(key, String(value));
        });
        const qs = query.toString() ? `?${query.toString()}` : "";
        return fetchWithAuth<PaginatedThreads>(`/community/threads${qs}`);
    },

    /**
     * Get a single thread by ID with replies
     */
    async getThread(id: string, params: { replyPage?: number; replyLimit?: number } = {}): Promise<ThreadDetailResponse> {
        const query = new URLSearchParams();
        if (params.replyPage) query.append("replyPage", String(params.replyPage));
        if (params.replyLimit) query.append("replyLimit", String(params.replyLimit));
        const qs = query.toString() ? `?${query.toString()}` : "";
        return fetchWithAuth<ThreadDetailResponse>(`/community/threads/${id}${qs}`);
    },

    /**
     * Create a new thread
     */
    async createThread(data: {
        title: string;
        body: string;
        type?: ThreadType;
        tags?: string[];
        courseId?: string;
        milestoneId?: string;
    }): Promise<{ success: boolean; data: Thread }> {
        return fetchWithAuth("/community/threads", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    /**
     * Update an existing thread
     */
    async updateThread(id: string, data: Partial<Thread>): Promise<{ success: boolean; data: Thread }> {
        return fetchWithAuth(`/community/threads/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    },

    /**
     * Delete a thread (soft delete)
     */
    async deleteThread(id: string): Promise<{ success: boolean }> {
        return fetchWithAuth(`/community/threads/${id}`, {
            method: "DELETE",
        });
    },

    /**
     * Toggle upvote on a thread
     */
    async voteThread(id: string): Promise<{ success: boolean; data: { upvotes: number } }> {
        return fetchWithAuth(`/community/threads/${id}/vote`, {
            method: "POST",
        });
    },

    /**
     * Create a reply to a thread
     */
    async createReply(threadId: string, data: { body: string; parentReplyId?: string }): Promise<{ success: boolean; data: Reply }> {
        return fetchWithAuth(`/community/threads/${threadId}/replies`, {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    /**
     * Toggle upvote on a reply
     */
    async voteReply(threadId: string, replyId: string): Promise<{ success: boolean; data: { upvotes: number } }> {
        return fetchWithAuth(`/community/threads/${threadId}/replies/${replyId}/vote`, {
            method: "POST",
        });
    },

    /**
     * Accept a reply as the solution (Thread author only)
     */
    async acceptReply(threadId: string, replyId: string): Promise<{ success: boolean; data: { replyId: string; isSolved: boolean } }> {
        return fetchWithAuth(`/community/threads/${threadId}/replies/${replyId}/accept`, {
            method: "POST",
        });
    },

    /**
     * Delete a reply (soft delete)
     */
    async deleteReply(threadId: string, replyId: string): Promise<{ success: boolean }> {
        return fetchWithAuth(`/community/threads/${threadId}/replies/${replyId}`, {
            method: "DELETE",
        });
    },
};
